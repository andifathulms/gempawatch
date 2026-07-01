"""
One-time historical bootstrap.

  1. Load static reference data (regions, faults, disasters).
  2. Pull USGS historical events for the Indonesia bbox, 1970–present, M4.0+,
     chunked by year to stay under the USGS 20,000-result cap.
  3. Reverse-geocode each event to its nearest AdminRegion.
  4. Trigger initial RegionRiskProfile computation.

Usage:
    python manage.py earthquake_bootstrap
    python manage.py earthquake_bootstrap --start-year 2000 --min-magnitude 4.5
    python manage.py earthquake_bootstrap --skip-usgs   # reference data only
"""
from datetime import date

from django.core.management.base import BaseCommand

from apps.disasters.loader import load_historical_disasters
from apps.earthquakes.models import EarthquakeEvent
from apps.earthquakes.tasks.usgs import ingest_usgs_range
from apps.faults.loader import load_fault_lines
from apps.regions.geocode import nearest_region
from apps.regions.loader import load_admin_regions


class Command(BaseCommand):
    help = "Bootstrap reference data + USGS historical earthquake backfill."

    def add_arguments(self, parser):
        parser.add_argument("--start-year", type=int, default=1970)
        parser.add_argument("--end-year", type=int, default=date.today().year)
        parser.add_argument("--min-magnitude", type=float, default=4.0)
        parser.add_argument(
            "--skip-usgs",
            action="store_true",
            help="Load reference data only, skip the USGS historical pull.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Loading reference data..."))
        n_regions = load_admin_regions()
        n_faults = load_fault_lines()
        n_disasters = load_historical_disasters()
        self.stdout.write(
            f"  regions={n_regions} faults={n_faults} disasters={n_disasters}"
        )

        if not options["skip_usgs"]:
            self._bootstrap_usgs(
                options["start_year"], options["end_year"], options["min_magnitude"]
            )
            self._assign_regions()
            self._compute_profiles()

        total = EarthquakeEvent.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Bootstrap complete. {total} events in DB."))

    def _bootstrap_usgs(self, start_year, end_year, min_magnitude):
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"USGS historical pull {start_year}–{end_year} (M{min_magnitude}+)..."
            )
        )
        grand_created = 0
        for year in range(start_year, end_year + 1):
            start = f"{year}-01-01"
            end = f"{year + 1}-01-01"
            try:
                result = ingest_usgs_range(start, end, min_magnitude)
            except Exception as exc:  # noqa: BLE001 — keep going on a bad year
                self.stderr.write(f"  {year}: FAILED ({exc})")
                continue
            grand_created += result["created"]
            self.stdout.write(
                f"  {year}: fetched={result['fetched']} "
                f"created={result['created']} matched={result['matched']}"
            )
        self.stdout.write(f"  total new events: {grand_created}")

    def _assign_regions(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Reverse-geocoding events to regions..."))
        unassigned = EarthquakeEvent.objects.filter(region__isnull=True)
        updated = 0
        for event in unassigned.iterator(chunk_size=500):
            region = nearest_region(event.location)
            if region:
                event.region = region
                event.save(update_fields=["region"])
                updated += 1
        self.stdout.write(f"  assigned {updated} events to regions")

    def _compute_profiles(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Computing initial risk profiles..."))
        # Imported here to avoid a circular import at module load time.
        from apps.regions.tasks.risk_profile import recompute_region_risk_profiles

        recompute_region_risk_profiles()
        self.stdout.write("  risk profiles computed")
