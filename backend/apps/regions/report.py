"""
Live single-point risk report for the "Am I In a Risk Zone?" tool.

This is the ONE spatial aggregation allowed to run on request (PRD) — it is a
single point query, cheap enough to compute live. Returns a plain dict that the
DRF risk-check endpoint serializes directly.
"""
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Max

from apps.earthquakes.models import EarthquakeEvent
from apps.regions.geocode import nearest_region
from apps.regions.risk_logic import classify_tsunami_risk, find_nearest_fault

RISK_CHECK_RADIUS_KM = 50

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

    return {
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
        "methodology_note": (
            "Indikator pola historis, bukan prediksi. Jumlah gempa M4+ dalam radius "
            "50km sepanjang catatan sejarah. Bukan sistem peringatan dini tsunami — "
            "selalu rujuk peringatan resmi BMKG."
        ),
        "source_attribution": [
            "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
            "Data: United States Geological Survey (USGS)",
        ],
    }
