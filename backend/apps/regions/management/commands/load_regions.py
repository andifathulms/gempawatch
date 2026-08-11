"""
Load admin regions from the committed GeoJSON into the database.

Why this exists as its own command:

Adding a kabupaten/kota used to require a local backend. load_admin_regions()
was only ever called by `earthquake_bootstrap`, and the publish pipeline runs
that only when the cached database snapshot is missing — the normal path
restores the snapshot and calls `refresh_for_export`, which recomputes profiles
for regions already in the database but never re-reads the GeoJSON. So editing
data/admin_regions.geojson and pushing did nothing, and the region list could
only change by someone spinning up Postgres locally and re-snapshotting.

With this wired into the workflow ahead of refresh_for_export, adding a region
is: add a feature to the GeoJSON, commit. The profile, the page, the sitemap
entry and the leaderboard row all follow from the events already in the
database.

The loader upserts on slug, so re-running is safe and re-running is exactly
what every publish does.
"""
from django.core.management.base import BaseCommand

from apps.regions.loader import load_admin_regions
from apps.regions.models import AdminRegion


class Command(BaseCommand):
    help = "Upsert AdminRegion rows from data/admin_regions.geojson."

    def handle(self, *args, **options):
        before = AdminRegion.objects.count()
        loaded = load_admin_regions()
        after = AdminRegion.objects.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Loaded {loaded} regions from GeoJSON "
                f"({before} -> {after} in database, {after - before} new)."
            )
        )

        # Regions are never deleted here: a slug that disappears from the file
        # would leave a published page with no data behind it, and silently
        # dropping rows during a publish is not something a data-loading step
        # should decide on its own.
        if after < loaded:
            self.stdout.write(
                self.style.WARNING(
                    "Fewer rows than features — check for duplicate slugs."
                )
            )
