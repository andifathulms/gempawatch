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

    qualifying = count_qualifying_tsunami_events(point)
    if qualifying >= TSUNAMI_HIGH_THRESHOLD:
        return "HIGH"
    if qualifying >= TSUNAMI_MODERATE_THRESHOLD:
        return "MODERATE"
    return "LOW"


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
