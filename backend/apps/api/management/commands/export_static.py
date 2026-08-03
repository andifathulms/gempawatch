"""
Export the whole read-only API as a static file tree, for hosting the frontend
on a static host (GitHub Pages) with no running Django process.

The exporter drives the *real* DRF views through Django's test client rather
than reimplementing any queries. That is deliberate: the static payloads are
byte-identical to what the live API serves, so the two deployment modes cannot
drift apart in shape.

Output layout (mirrors the live URL paths, so the frontend only swaps its base):

    <out>/api/<path>/index.json     one file per GET endpoint
    <out>/data/events.csv           quantized event set for the client-side engine
    <out>/data/engine-meta.json     scores + constants the engine needs

Paginated endpoints are flattened: every page is walked and merged into a single
PageNumberPagination-shaped envelope with next/previous set to null. No frontend
view paginates, and a static host cannot serve ?page=N anyway.

Deliberately NOT exported: per-event detail (/api/earthquakes/{id}/). That would
be ~70k files for a route no component calls. `api.event()` is unavailable in
static mode; the static api client raises a clear error if it is ever called.

Usage:
    python manage.py export_static
    python manage.py export_static --out ./out --indent 0
"""
import csv
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.test import Client

from apps.earthquakes.models import EarthquakeEvent
from apps.regions.models import AdminRegion, RegionRiskProfile
from apps.regions.report import RISK_CHECK_RADIUS_KM, SCORE_RADIUS_KM
from apps.regions.risk_logic import (
    TSUNAMI_HIGH_THRESHOLD,
    TSUNAMI_MAX_DEPTH_KM,
    TSUNAMI_MIN_MAGNITUDE,
    TSUNAMI_MODERATE_THRESHOLD,
    TSUNAMI_SEARCH_RADIUS_KM,
)

# Endpoints with no parameters. Exported verbatim.
STATIC_ENDPOINTS = [
    "/api/earthquakes/live/",
    "/api/earthquakes/live/?format_geo=geojson",
    "/api/earthquakes/felt/",
    "/api/regions/",
    "/api/faults/",
    "/api/tsunami-risk/coastal-zones/",
    "/api/disasters/timeline/",
    "/api/meta/",
]

# Leaderboard is exported once at max size; the static client slices it locally
# for any (limit, order) combination the UI asks for.
LEADERBOARD_ENDPOINTS = [
    "/api/regions/leaderboard/?limit=50&order=desc",
    "/api/regions/leaderboard/?limit=50&order=asc",
]

# Per-region endpoints, expanded across every region in the DB.
REGION_ENDPOINT_TEMPLATES = [
    "/api/regions/{slug}/",
    "/api/regions/{slug}/risk-profile/",
    "/api/regions/{slug}/timeline/",
]


class Command(BaseCommand):
    help = "Export the read-only API to a static JSON tree for static hosting."

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            default="out",
            help="Output directory (default: ./out relative to manage.py).",
        )
        parser.add_argument(
            "--indent",
            type=int,
            default=0,
            help="JSON indent. 0 (default) writes compact files for shipping.",
        )

    def handle(self, *args, **options):
        out = Path(options["out"]).resolve()
        self.indent = options["indent"] or None
        self.client = Client()
        self.written = []

        if not AdminRegion.objects.exists():
            raise CommandError(
                "No AdminRegion rows found — run `manage.py earthquake_bootstrap` first."
            )

        self.stdout.write(self.style.MIGRATE_HEADING(f"Exporting static API to {out}"))

        for url in STATIC_ENDPOINTS:
            self._export(out, url)

        for url in LEADERBOARD_ENDPOINTS:
            self._export(out, url)

        slugs = list(AdminRegion.objects.values_list("slug", flat=True))
        for slug in slugs:
            for template in REGION_ENDPOINT_TEMPLATES:
                self._export(out, template.format(slug=slug))
        self.stdout.write(f"  expanded {len(slugs)} regions")

        self._export_engine_data(out)
        self._report(out)

    # ------------------------------------------------------------------ export

    def _export(self, out: Path, url: str):
        """Fetch `url` through the real DRF stack and write it to the tree."""
        payload = self._fetch(url)
        path = self._path_for(out, url)
        self._write_json(path, payload)

    def _fetch(self, url: str):
        response = self.client.get(url, HTTP_ACCEPT="application/json")
        if response.status_code != 200:
            raise CommandError(f"{url} returned HTTP {response.status_code}")
        payload = response.json()

        # Flatten paginated envelopes by walking every page.
        if isinstance(payload, dict) and "results" in payload and "next" in payload:
            payload = self._flatten_pages(url, payload)
        return payload

    def _flatten_pages(self, url: str, first_page: dict) -> dict:
        results = list(first_page["results"])
        page = 2
        while first_page.get("next"):
            sep = "&" if "?" in url else "?"
            response = self.client.get(
                f"{url}{sep}page={page}", HTTP_ACCEPT="application/json"
            )
            if response.status_code != 200:
                break
            body = response.json()
            results.extend(body["results"])
            first_page = body
            page += 1
        return {
            "count": len(results),
            "next": None,
            "previous": None,
            "results": results,
        }

    def _path_for(self, out: Path, url: str) -> Path:
        """
        Map an API URL to a file path. Query strings become a filename suffix so
        that e.g. ?format_geo=geojson lands beside the plain variant.
        """
        path, _, query = url.partition("?")
        parts = [p for p in path.strip("/").split("/") if p]
        if query:
            suffix = query.replace("&", "_").replace("=", "-")
            return out.joinpath(*parts, f"{suffix}.json")
        return out.joinpath(*parts, "index.json")

    def _write_json(self, path: Path, payload):
        path.parent.mkdir(parents=True, exist_ok=True)
        text = json.dumps(payload, indent=self.indent, ensure_ascii=False)
        path.write_text(text, encoding="utf-8")
        self.written.append(path)

    # ------------------------------------------------------------- engine data

    def _export_engine_data(self, out: Path):
        """
        Dump the event set the client-side risk engine needs, plus the constants
        and stored scores it has to reproduce Django's answers exactly.

        Coordinates are rounded to 2dp (~1.1 km) — far finer than the 50/100/150 km
        radii the engine works with, and it roughly halves the payload.
        """
        events_path = out / "data" / "events.csv"
        events_path.parent.mkdir(parents=True, exist_ok=True)

        rows = EarthquakeEvent.objects.values_list(
            "location", "magnitude", "depth_km", "event_time"
        ).iterator(chunk_size=5000)

        count = 0
        with events_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["lon", "lat", "mag", "depth", "year"])
            for location, magnitude, depth_km, event_time in rows:
                if location is None or magnitude is None:
                    continue
                writer.writerow(
                    [
                        round(location.x, 2),
                        round(location.y, 2),
                        round(magnitude, 1),
                        "" if depth_km is None else round(depth_km),
                        event_time.year,
                    ]
                )
                count += 1
        self.written.append(events_path)

        # Stored region scores drive the percentile rank in the risk report;
        # the engine ranks a live score against exactly this list.
        scores = sorted(
            RegionRiskProfile.objects.filter(composite_score__isnull=False).values_list(
                "composite_score", flat=True
            )
        )
        self._write_json(
            out / "data" / "engine-meta.json",
            {
                "event_count": count,
                "stored_scores": scores,
                "constants": {
                    "risk_check_radius_km": RISK_CHECK_RADIUS_KM,
                    "score_radius_km": SCORE_RADIUS_KM,
                    "tsunami_search_radius_km": TSUNAMI_SEARCH_RADIUS_KM,
                    "tsunami_max_depth_km": TSUNAMI_MAX_DEPTH_KM,
                    "tsunami_min_magnitude": TSUNAMI_MIN_MAGNITUDE,
                    "tsunami_high_threshold": TSUNAMI_HIGH_THRESHOLD,
                    "tsunami_moderate_threshold": TSUNAMI_MODERATE_THRESHOLD,
                },
            },
        )
        self.stdout.write(f"  engine dataset: {count:,} events")

    # ----------------------------------------------------------------- reporting

    def _report(self, out: Path):
        total = sum(p.stat().st_size for p in self.written)
        largest = max(self.written, key=lambda p: p.stat().st_size)
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {len(self.written)} files, {total / 1_048_576:.2f} MB total."
            )
        )
        self.stdout.write(
            f"  largest: {largest.relative_to(out)} "
            f"({largest.stat().st_size / 1024:.0f} kB)"
        )
