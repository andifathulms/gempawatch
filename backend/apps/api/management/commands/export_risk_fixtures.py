"""
Emit golden fixtures pinning Django's risk-report output at a spread of points.

These are the contract between the authoritative Python risk engine and its
TypeScript port used in static builds. The TS test suite replays every fixture
and asserts it reproduces the same answer. Without this, the two engines drift
silently and GempaWatch starts publishing risk numbers that disagree with its
own methodology — the one failure mode that actually matters for this app.

Python is the source of truth. When the methodology changes, change it in
Python, regenerate fixtures, and let the TS tests fail until the port catches up.

Usage:
    python manage.py export_risk_fixtures --out ../frontend/src/lib/engine/__fixtures__
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.regions.models import AdminRegion
from apps.regions.report import build_point_risk_report

# Hand-picked probes: dense seismic zones, quiet interiors, coastal vs inland,
# offshore water, and the extreme corners of the Indonesia bounding box.
PROBE_POINTS = [
    ("jakarta", -6.200, 106.800),
    ("banda-aceh", 5.548, 95.324),
    ("padang", -0.947, 100.417),
    ("palu", -0.900, 119.870),
    ("mentawai-offshore", -2.500, 99.500),
    ("yogyakarta", -7.797, 110.371),
    ("lombok", -8.650, 116.324),
    ("ambon", -3.695, 128.181),
    ("jayapura", -2.533, 140.717),
    ("pontianak-quiet", -0.026, 109.342),
    ("bbox-nw", 5.900, 95.100),
    ("bbox-se", -10.900, 140.900),
    ("open-ocean", -5.000, 105.000),
    ("sumba", -9.650, 120.250),
    ("manado", 1.474, 124.842),
]


class Command(BaseCommand):
    help = "Export golden risk-report fixtures for the TypeScript engine tests."

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            default="../frontend/src/lib/engine/__fixtures__",
            help="Directory to write fixtures into.",
        )

    def handle(self, *args, **options):
        out = Path(options["out"]).resolve()
        out.mkdir(parents=True, exist_ok=True)

        points = list(PROBE_POINTS)
        # Add every region centroid so each shipped region is covered too.
        for region in AdminRegion.objects.all():
            points.append((f"region-{region.slug}", region.centroid.y, region.centroid.x))

        fixtures = []
        for name, lat, lng in points:
            report = build_point_risk_report(latitude=lat, longitude=lng)
            fixtures.append(
                {
                    "name": name,
                    "lat": lat,
                    "lng": lng,
                    "expected": {
                        # Only the computed fields — prose and attribution are
                        # constants and would just make the fixtures noisy.
                        "composite_score": report["composite_score"],
                        "activity_tier": report["activity_tier"],
                        "activity_percentile": report["activity_percentile"],
                        "event_count_m4_within_50km": report[
                            "event_count_m4_within_50km"
                        ],
                        "largest_magnitude_within_50km": report[
                            "largest_magnitude_within_50km"
                        ],
                        "overall_risk_band": report["overall_risk_band"],
                        "nearest_region_slug": (
                            report["nearest_region"]["slug"]
                            if report["nearest_region"]
                            else None
                        ),
                        "nearest_fault_name": (
                            report["nearest_fault"]["name"]
                            if report["nearest_fault"]
                            else None
                        ),
                        "nearest_fault_distance_km": (
                            report["nearest_fault"]["distance_km"]
                            if report["nearest_fault"]
                            else None
                        ),
                        "tsunami_risk_tier": report["tsunami_risk_tier"],
                        "comparison_relation": report["comparison"]["relation"],
                        "data_coverage": report["data_coverage"],
                        # Everything below is derived output that the port has
                        # to reproduce too. Pinning only the headline score let
                        # the two engines disagree about WHICH event they had
                        # removed while both reported a plausible number: at
                        # Yogyakarta, Django dropped a deep 2001 M6.3 and the
                        # port a shallow 2006 M6.3 of the same magnitude, for
                        # different shallow ratios and a 0.2-point split. The
                        # tie-break is a documented rule now, so it is pinned
                        # like every other rule.
                        "score_breakdown": report["score_breakdown"],
                        "activity_percentile_basis": report[
                            "activity_percentile_basis"
                        ],
                        "comparison_set": report["comparison_set"],
                        "largest_event_sensitivity": report[
                            "largest_event_sensitivity"
                        ],
                        "tsunami_evidence": report["tsunami_evidence"],
                    },
                }
            )

        path = out / "risk-reports.json"
        path.write_text(
            json.dumps(fixtures, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        self.stdout.write(
            self.style.SUCCESS(f"Wrote {len(fixtures)} fixtures to {path}")
        )
