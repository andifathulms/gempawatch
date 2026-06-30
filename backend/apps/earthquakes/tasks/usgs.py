"""
USGS ingestion. Used for historical backfill (see management command) and a
daily "recent" sync that fills any gaps BMKG polling may have missed.

USGS caps a single query at 20,000 results — callers chunk by time range to
stay under that limit.
"""
import logging
from datetime import timedelta

import requests
from celery import shared_task
from django.utils import timezone

from apps.earthquakes.parsers import parse_usgs_feature

from .dedup import upsert_event

logger = logging.getLogger(__name__)

USGS_ENDPOINT = "https://earthquake.usgs.gov/fdsnws/event/1/query"

INDONESIA_BBOX = {
    "minlatitude": -11,
    "maxlatitude": 6,
    "minlongitude": 95,
    "maxlongitude": 141,
}

REQUEST_TIMEOUT = 60


def fetch_usgs(start_date: str, end_date: str, min_magnitude: float = 4.0) -> list[dict]:
    """
    Fetch USGS events (GeoJSON) for the Indonesia bbox in [start_date, end_date).
    Returns the raw `features` list. Dates are ISO strings (YYYY-MM-DD).
    """
    params = {
        "format": "geojson",
        "starttime": start_date,
        "endtime": end_date,
        "minmagnitude": min_magnitude,
        "orderby": "time-asc",
        **INDONESIA_BBOX,
    }
    response = requests.get(USGS_ENDPOINT, params=params, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json().get("features", [])


def ingest_usgs_range(start_date: str, end_date: str, min_magnitude: float = 4.0) -> dict:
    """Fetch + upsert one USGS time range. Returns created/matched counts."""
    features = fetch_usgs(start_date, end_date, min_magnitude)
    created = matched = 0
    for feature in features:
        try:
            event_dict = parse_usgs_feature(feature)
        except (KeyError, ValueError, TypeError) as exc:
            logger.warning("Skipping malformed USGS feature: %s", exc)
            continue
        _, was_created = upsert_event(event_dict)
        created += int(was_created)
        matched += int(not was_created)
    return {"fetched": len(features), "created": created, "matched": matched}


@shared_task
def sync_usgs_recent(days: int = 7, min_magnitude: float = 4.0) -> dict:
    """Daily catch-up sync of the last `days` of USGS events for Indonesia."""
    end = timezone.now().date()
    start = end - timedelta(days=days)
    result = ingest_usgs_range(start.isoformat(), end.isoformat(), min_magnitude)
    logger.info("USGS recent sync %s..%s: %s", start, end, result)
    return result
