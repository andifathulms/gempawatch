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
    score_breakdown,
    score_to_tier,
)

RISK_CHECK_RADIUS_KM = 50
SCORE_RADIUS_KM = 100  # matches region-profile radius so scores are comparable

# Reference cities for the "higher/similar/lower risk than X" comparison.
# Values are approximate M4+ counts within 50km, used only for relative framing.
#
# Jakarta stays first because `comparison` (singular) anchors on it: it is the
# city most readers have a feel for, and a low-activity anchor. Padang and Palu
# were declared here and never read — every comparison sentence on the site said
# "dibanding Jakarta" while the code implied a richer set. They are now used, in
# `comparison_set`, because one anchor cannot tell you whether you are near the
# quiet end or the active end of Indonesia's range.
REFERENCE_CITIES = [
    {"name": "Jakarta", "m4_count": 25},
    {"name": "Padang", "m4_count": 220},
    {"name": "Palu", "m4_count": 180},
]


def _risk_band(m4_count: int) -> str:
    """
    Density band from the RAW M4+ count within 50km.

    Deliberately not the same question as score_to_tier(), which runs the
    weighted composite over 100km. Different input, different radius, different
    thresholds — so the two can and do disagree, and anything rendering both
    must say which is which rather than showing two bare risk words.
    """
    if m4_count >= 150:
        return "HIGH"
    if m4_count >= 40:
        return "MODERATE"
    return "LOW"


def _relation_to(m4_count: int, reference: dict) -> str:
    if m4_count > reference["m4_count"] * 1.25:
        return "higher"
    if m4_count < reference["m4_count"] * 0.75:
        return "lower"
    return "similar"


def _compare_to_reference(m4_count: int) -> dict:
    """Compare this location's M4+ count to a mid reference city (Jakarta)."""
    reference = REFERENCE_CITIES[0]
    relation = _relation_to(m4_count, reference)
    return {
        "reference_city": reference["name"],
        "relation": relation,
        "text": f"Risiko historis lokasi ini {_relation_id(relation)} "
        f"dibanding {reference['name']}.",
    }


def _comparison_set(m4_count: int) -> list[dict]:
    """The same comparison against every reference anchor, not just Jakarta."""
    return [
        {
            "reference_city": ref["name"],
            "reference_m4_count": ref["m4_count"],
            "relation": _relation_to(m4_count, ref),
        }
        for ref in REFERENCE_CITIES
    ]


def _relation_id(relation: str) -> str:
    return {"higher": "lebih tinggi", "lower": "lebih rendah", "similar": "serupa"}[
        relation
    ]


def _largest_event_counterfactual(
    score_area,
    largest_magnitude: float | None,
    fault_distance_km: float | None,
    base_score: float,
) -> dict | None:
    """
    Recompute the score with the single largest nearby event removed.

    The magnitude term is driven by an extremum, not an average, so exactly one
    row can move up to 30 of the 100 points — and it never decays, so a single
    afternoon in 1976 can still be most of what a place's score says today.
    Whether a score rests on a sustained pattern or on one bad day is a
    genuinely different risk story, and the composite flattens both into the
    same number.

    Removal is honest rather than convenient: dropping the event changes the M4
    count, the shallow ratio and possibly the observed year span too, so all
    four inputs are recomputed instead of holding three fixed and moving
    magnitude alone. That distinction matters most exactly where the
    counterfactual is most interesting — a sparse area where the big one is also
    a large share of the whole record.

    Returns None when there is nothing to remove, or when removing it would
    leave no events at all: there is no meaningful "without it" for a record
    of one.
    """
    if largest_magnitude is None:
        return None

    biggest = score_area.filter(magnitude=largest_magnitude).order_by("id").first()
    if biggest is None:
        return None

    remaining = score_area.exclude(pk=biggest.pk)
    total = remaining.count()
    if total == 0:
        return None

    agg = remaining.aggregate(
        largest=Max("magnitude"),
        earliest=Min(ExtractYear("event_time")),
        latest=Max(ExtractYear("event_time")),
    )
    coverage_years = (
        (agg["latest"] - agg["earliest"] + 1)
        if agg["earliest"] and agg["latest"]
        else 0
    )
    without_score = compute_composite_score(
        ScoreInputs(
            m4_count=remaining.filter(magnitude__gte=4.0).count(),
            coverage_years=coverage_years,
            largest_magnitude=agg["largest"],
            shallow_ratio=remaining.filter(depth_km__lt=70).count() / total,
            nearest_fault_distance_km=fault_distance_km,
        )
    )
    return {
        "removed": {
            "magnitude": biggest.magnitude,
            "year": biggest.event_time.year,
            "depth_km": biggest.depth_km,
        },
        "next_largest_magnitude": agg["largest"],
        "score_without": without_score,
        "score_delta": round(base_score - without_score, 1),
        "tier_without": score_to_tier(without_score),
    }


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
    score_inputs = ScoreInputs(
        m4_count=score_area.filter(magnitude__gte=4.0).count(),
        coverage_years=coverage_years,
        largest_magnitude=score_agg["largest"],
        shallow_ratio=shallow_ratio,
        nearest_fault_distance_km=fault_distance_km,
    )
    composite_score = compute_composite_score(score_inputs)
    stored_scores = list(
        RegionRiskProfile.objects.filter(composite_score__isnull=False).values_list(
            "composite_score", flat=True
        )
    )
    activity_percentile = (
        percentile_rank(composite_score, stored_scores) if stored_scores else None
    )
    # The percentile ranks against the regions this deployment has scored — NOT
    # against Indonesia, and not against a random sample of it. Reported as a
    # bare "82nd percentile" it reads as national, which is a claim the number
    # cannot support, so the size of the comparison set travels with it.
    activity_percentile_basis = {"region_count": len(stored_scores)}

    return {
        "composite_score": composite_score,
        "score_breakdown": score_breakdown(score_inputs),
        "activity_tier": score_to_tier(composite_score),
        "activity_percentile": activity_percentile,
        "activity_percentile_basis": activity_percentile_basis,
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
        "comparison_set": _comparison_set(m4_count),
        "largest_event_sensitivity": _largest_event_counterfactual(
            score_area, score_agg["largest"], fault_distance_km, composite_score
        ),
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
