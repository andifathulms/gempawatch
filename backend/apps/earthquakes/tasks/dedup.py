"""
Deduplication + upsert logic. Runs after every BMKG poll.

Two events are the same physical quake if they occur within
DEDUP_TIME_WINDOW_MINUTES and DEDUP_DISTANCE_KM of each other. When both
sources report it, BMKG is authoritative for Indonesian events and upgrades
an existing USGS record in place.
"""
from datetime import timedelta

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

from apps.earthquakes.models import EarthquakeEvent

DEDUP_TIME_WINDOW_MINUTES = 5
DEDUP_DISTANCE_KM = 50

# Fields copied when upgrading a USGS record to BMKG.
_UPGRADE_FIELDS = (
    "external_id",
    "source",
    "event_time",
    "magnitude",
    "depth_km",
    "location",
    "latitude",
    "longitude",
    "location_description",
    "felt_reports",
    "potensi_tsunami",
    "shakemap_url",
    "raw_data",
)


def find_duplicate(new_event: dict) -> EarthquakeEvent | None:
    """Return an existing event matching the new one by time+distance, or None."""
    time_lower = new_event["event_time"] - timedelta(minutes=DEDUP_TIME_WINDOW_MINUTES)
    time_upper = new_event["event_time"] + timedelta(minutes=DEDUP_TIME_WINDOW_MINUTES)

    candidates = (
        EarthquakeEvent.objects.filter(
            event_time__range=(time_lower, time_upper),
            location__distance_lte=(new_event["location"], D(km=DEDUP_DISTANCE_KM)),
        )
        .annotate(distance=Distance("location", new_event["location"]))
        .order_by("distance")
    )
    return candidates.first()


def upsert_event(new_event: dict) -> tuple[EarthquakeEvent, bool]:
    """
    Insert a new event, or merge it into an existing duplicate.

    Returns (event, created). BMKG always wins on conflict: a BMKG event that
    matches an existing USGS record overwrites that record's fields in place.
    """
    source = new_event["source"]

    # Exact external_id hit — idempotent re-poll, nothing to do.
    existing_by_id = EarthquakeEvent.objects.filter(
        external_id=new_event["external_id"]
    ).first()
    if existing_by_id:
        return existing_by_id, False

    duplicate = find_duplicate(new_event)
    if duplicate:
        if source == "BMKG" and duplicate.source == "USGS":
            for field in _UPGRADE_FIELDS:
                setattr(duplicate, field, new_event[field])
            duplicate.save()
        # Otherwise keep the existing record (BMKG already authoritative, or
        # an incoming USGS event that BMKG already covers).
        return duplicate, False

    return EarthquakeEvent.objects.create(**new_event), True
