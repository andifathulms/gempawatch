"""
One-shot data refresh for the static publishing pipeline.

Celery beat drives ingestion on a live deploy. A static build has no worker, so
the scheduled GitHub Actions job calls this instead: it runs the same task
functions inline, in the same order beat would, then recomputes risk profiles so
the export reflects the new events.

Ingestion is best-effort. BMKG and USGS are third-party services, and a fetch
failing is a normal Tuesday — it must not take down a publish that would
otherwise ship a perfectly good (if slightly staler) site. Profile computation
is not best-effort: if that fails the export would carry inconsistent numbers,
so the command exits non-zero.

Usage:
    python manage.py refresh_for_export
    python manage.py refresh_for_export --skip-usgs
"""
from django.core.management.base import BaseCommand, CommandError

from apps.earthquakes.tasks.bmkg import poll_bmkg_all
from apps.earthquakes.tasks.usgs import sync_usgs_recent
from apps.regions.tasks.risk_profile import recompute_region_risk_profiles


class Command(BaseCommand):
    help = "Poll BMKG, sync recent USGS, and recompute risk profiles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--usgs-days",
            type=int,
            default=14,
            help="How far back to re-sync USGS (default 14, covers a missed run).",
        )
        parser.add_argument("--skip-bmkg", action="store_true")
        parser.add_argument("--skip-usgs", action="store_true")

    def handle(self, *args, **options):
        if not options["skip_bmkg"]:
            self._best_effort("BMKG poll", poll_bmkg_all)

        if not options["skip_usgs"]:
            self._best_effort(
                "USGS sync", sync_usgs_recent, days=options["usgs_days"]
            )

        self.stdout.write(self.style.MIGRATE_HEADING("Recomputing risk profiles..."))
        try:
            result = recompute_region_risk_profiles()
        except Exception as exc:  # noqa: BLE001 — surfaced immediately below
            raise CommandError(f"risk profile computation failed: {exc}") from exc
        self.stdout.write(self.style.SUCCESS(f"  {result}"))

    def _best_effort(self, label: str, func, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING(f"{label}..."))
        try:
            result = func(**kwargs)
            self.stdout.write(f"  {result}")
        except Exception as exc:  # noqa: BLE001 — upstream outage must not block publish
            self.stderr.write(
                self.style.WARNING(f"  {label} failed ({exc}) — continuing with existing data.")
            )
