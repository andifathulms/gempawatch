"""
Risk classification logic. Kept separate from the Celery task so it can be
reused by the live risk-check endpoint and unit-tested in isolation.

IMPORTANT: These are historical-pattern indicators, NOT official warnings.
GempaWatch never replaces BMKG's real-time tsunami alert system.
"""
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

from apps.earthquakes.models import EarthquakeEvent
from apps.faults.models import FaultLine

# Tsunami classification thresholds — documented so the frontend can explain them.
TSUNAMI_SEARCH_RADIUS_KM = 150
TSUNAMI_MAX_DEPTH_KM = 70
TSUNAMI_MIN_MAGNITUDE = 6.5
TSUNAMI_HIGH_THRESHOLD = 3  # qualifying events for HIGH
TSUNAMI_MODERATE_THRESHOLD = 1  # qualifying events for MODERATE


def count_qualifying_tsunami_events(point: Point) -> int:
    """
    Count historical events near `point` that fit the tsunami-generating pattern:
    shallow (<70km), strong (>=M6.5), within 150km. Offshore is approximated by
    the region's precomputed is_coastal flag at the call site.
    """
    return EarthquakeEvent.objects.filter(
        location__distance_lte=(point, D(km=TSUNAMI_SEARCH_RADIUS_KM)),
        depth_km__lt=TSUNAMI_MAX_DEPTH_KM,
        magnitude__gte=TSUNAMI_MIN_MAGNITUDE,
    ).count()


def classify_tsunami_risk(is_coastal: bool, point: Point) -> str | None:
    """
    Return tsunami risk tier for a location.

    Criteria (NOT an official warning system — historical pattern indicator only):
      - Non-coastal            -> None
      - Coastal, 3+ qualifying -> HIGH
      - Coastal, 1-2 qualifying-> MODERATE
      - Coastal, 0 qualifying  -> LOW
    """
    if not is_coastal:
        return None
    return _tier_for(count_qualifying_tsunami_events(point))


def _tier_for(qualifying: int) -> str:
    if qualifying >= TSUNAMI_HIGH_THRESHOLD:
        return "HIGH"
    if qualifying >= TSUNAMI_MODERATE_THRESHOLD:
        return "MODERATE"
    return "LOW"


def tsunami_evidence(is_coastal: bool, point: Point) -> dict:
    """
    The tier AND the count that produced it, plus the thresholds it was tested
    against.

    The tier was previously the only thing that left this module: the qualifying
    count was computed, compared, and discarded. So the product's second
    headline output arrived as a bare verdict — "SEDANG" — with no way for a
    reader to see that it rests on, say, two events, or to check that against
    the rule. That is the same defect the composite score's breakdown fixed, on
    the output with the higher stakes.

    `coastal_is_approximate` travels with it because the whole classification
    hangs on a precomputed is_coastal flag that stands in for "offshore
    epicentre". That is a simplification, and it should be admitted next to the
    verdict rather than on a methodology page the reader never opens.
    """
    if not is_coastal:
        return {
            "tier": None,
            "qualifying_events": 0,
            "is_coastal": False,
            "coastal_is_approximate": True,
            "criteria": _criteria(),
        }
    qualifying = count_qualifying_tsunami_events(point)
    return {
        "tier": _tier_for(qualifying),
        "qualifying_events": qualifying,
        "is_coastal": True,
        "coastal_is_approximate": True,
        "criteria": _criteria(),
    }


def _criteria() -> dict:
    """The thresholds, shipped so the UI states the rule where it applies."""
    return {
        "search_radius_km": TSUNAMI_SEARCH_RADIUS_KM,
        "max_depth_km": TSUNAMI_MAX_DEPTH_KM,
        "min_magnitude": TSUNAMI_MIN_MAGNITUDE,
        "high_threshold": TSUNAMI_HIGH_THRESHOLD,
        "moderate_threshold": TSUNAMI_MODERATE_THRESHOLD,
    }


def find_nearest_fault(point: Point) -> tuple[FaultLine | None, float | None]:
    """Return (nearest FaultLine, distance_km) for a point, or (None, None)."""
    nearest = (
        FaultLine.objects.annotate(distance=Distance("geometry", point))
        .order_by("distance")
        .first()
    )
    if nearest is None:
        return None, None
    # Distance annotation is in meters when using a projected/geographic distance;
    # recompute in km explicitly for a clean value.
    distance_km = round(nearest.distance.km, 2) if hasattr(nearest.distance, "km") else None
    return nearest, distance_km
