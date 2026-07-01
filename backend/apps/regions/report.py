"""
Live single-point risk report for the "Am I In a Risk Zone?" tool.

This is the ONE spatial aggregation allowed to run on request (PRD) — it is a
single point query, cheap enough to compute live. Returns a plain dict that the
DRF risk-check endpoint serializes directly.
"""
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Max, Min
from django.db.models.functions import ExtractYear

from apps.earthquakes.models import EarthquakeEvent
from apps.regions.geocode import nearest_region
from apps.regions.models import RegionRiskProfile
from apps.regions.risk_logic import classify_tsunami_risk, find_nearest_fault
from apps.regions.scoring import (
    ScoreInputs,
    compute_composite_score,
    percentile_rank,
    score_to_tier,
)

RISK_CHECK_RADIUS_KM = 50
SCORE_RADIUS_KM = 100  # matches region-profile radius so scores are comparable

# Reference cities for the "higher/similar/lower risk than X" comparison.
# Values are approximate M4+ counts within 50km, used only for relative framing.
REFERENCE_CITIES = [
    {"name": "Jakarta", "m4_count": 25},
    {"name": "Padang", "m4_count": 220},
    {"name": "Palu", "m4_count": 180},
]


def _risk_band(m4_count: int) -> str:
    if m4_count >= 150:
        return "HIGH"
    if m4_count >= 40:
        return "MODERATE"
    return "LOW"


def _compare_to_reference(m4_count: int) -> dict:
    """Compare this location's M4+ count to a mid reference city (Jakarta)."""
    reference = REFERENCE_CITIES[0]
    if m4_count > reference["m4_count"] * 1.25:
        relation = "higher"
    elif m4_count < reference["m4_count"] * 0.75:
        relation = "lower"
    else:
        relation = "similar"
    return {
        "reference_city": reference["name"],
        "relation": relation,
        "text": f"Risiko historis lokasi ini {_relation_id(relation)} "
        f"dibanding {reference['name']}.",
    }


def _relation_id(relation: str) -> str:
    return {"higher": "lebih tinggi", "lower": "lebih rendah", "similar": "serupa"}[
        relation
    ]


def build_point_risk_report(latitude: float, longitude: float) -> dict:
    """Compute a full live risk report for arbitrary coordinates."""
    point = Point(longitude, latitude, srid=4326)

    nearby = EarthquakeEvent.objects.filter(
        location__distance_lte=(point, D(km=RISK_CHECK_RADIUS_KM))
    )
    m4_count = nearby.filter(magnitude__gte=4.0).count()
    largest = nearby.aggregate(m=Max("magnitude"))["m"]

    region = nearest_region(point)
    nearest_fault, fault_distance_km = find_nearest_fault(point)

    is_coastal = bool(region and region.is_coastal)
    tsunami_tier = classify_tsunami_risk(is_coastal, point)

    # Composite score computed over the 100km radius so it is directly
    # comparable to stored region scores; percentile ranks against those.
    score_area = EarthquakeEvent.objects.filter(
        location__distance_lte=(point, D(km=SCORE_RADIUS_KM))
    )
    score_agg = score_area.aggregate(
        largest=Max("magnitude"),
        earliest=Min(ExtractYear("event_time")),
        latest=Max(ExtractYear("event_time")),
    )
    score_total = score_area.count()
    score_shallow = score_area.filter(depth_km__lt=70).count()
    shallow_ratio = score_shallow / score_total if score_total else None
    coverage_years = (
        (score_agg["latest"] - score_agg["earliest"] + 1)
        if score_agg["earliest"] and score_agg["latest"]
        else 0
    )
    composite_score = compute_composite_score(
        ScoreInputs(
            m4_count=score_area.filter(magnitude__gte=4.0).count(),
            coverage_years=coverage_years,
            largest_magnitude=score_agg["largest"],
            shallow_ratio=shallow_ratio,
            nearest_fault_distance_km=fault_distance_km,
        )
    )
    stored_scores = list(
        RegionRiskProfile.objects.filter(composite_score__isnull=False).values_list(
            "composite_score", flat=True
        )
    )
    activity_percentile = (
        percentile_rank(composite_score, stored_scores) if stored_scores else None
    )

    return {
        "composite_score": composite_score,
        "activity_tier": score_to_tier(composite_score),
        "activity_percentile": activity_percentile,
        "query": {"latitude": latitude, "longitude": longitude},
        "nearest_region": (
            {"id": region.id, "name": region.name, "slug": region.slug, "type": region.type}
            if region
            else None
        ),
        "event_count_m4_within_50km": m4_count,
        "largest_magnitude_within_50km": largest,
        "overall_risk_band": _risk_band(m4_count),
        "nearest_fault": (
            {
                "id": nearest_fault.id,
                "name": nearest_fault.name,
                "distance_km": fault_distance_km,
            }
            if nearest_fault
            else None
        ),
        "tsunami_risk_tier": tsunami_tier,
        "comparison": _compare_to_reference(m4_count),
        "data_coverage": {
            "earliest_year": score_agg["earliest"],
            "latest_year": score_agg["latest"],
            "years": coverage_years,
        },
        "methodology_note": (
            "Indikator pola historis, bukan prediksi. Skor menimbang frekuensi, "
            "magnitudo terbesar, proporsi gempa dangkal, dan jarak ke sesar dalam "
            "radius 100km; jumlah M4+ dihitung dalam radius 50km. Persentil "
            "membandingkan lokasi ini dengan wilayah lain di basis data. Jumlah "
            "kejadian tidak dinormalisasi terhadap luas/populasi. Bukan sistem "
            "peringatan dini tsunami — selalu rujuk peringatan resmi BMKG."
        ),
        "source_attribution": [
            "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
            "Data: United States Geological Survey (USGS)",
        ],
    }
