"""
BMKG live polling tasks. Three feeds, polled every 5 minutes via Celery beat.

  autogempa.json       latest single event (object)
  gempaterkini.json    last 15 M5.0+      (list under Infogempa.gempa)
  gempadirasakan.json  last 15 felt       (list under Infogempa.gempa)

Both shapes (single object vs list) are handled by `_extract_gempa`.
"""
import logging

import requests
from celery import shared_task

from apps.earthquakes.parsers import parse_bmkg_event

from .dedup import upsert_event

logger = logging.getLogger(__name__)

BMKG_ENDPOINTS = {
    "latest": "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
    "recent_m5": "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json",
    "felt": "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json",
}

REQUEST_TIMEOUT = 15


def _extract_gempa(payload: dict) -> list[dict]:
    """Return a list of `gempa` objects regardless of single/list response shape."""
    gempa = payload.get("Infogempa", {}).get("gempa")
    if gempa is None:
        return []
    return gempa if isinstance(gempa, list) else [gempa]


def _poll_endpoint(url: str) -> dict:
    """Fetch one BMKG feed, parse + upsert every event. Returns counts."""
    response = requests.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    payload = response.json()

    created = matched = 0
    for gempa in _extract_gempa(payload):
        try:
            event_dict = parse_bmkg_event(gempa)
        except (KeyError, ValueError) as exc:
            logger.warning("Skipping malformed BMKG record from %s: %s", url, exc)
            continue
        _, was_created = upsert_event(event_dict)
        created += int(was_created)
        matched += int(not was_created)

    return {"url": url, "created": created, "matched": matched}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def poll_bmkg_autogempa(self):
    try:
        return _poll_endpoint(BMKG_ENDPOINTS["latest"])
    except requests.RequestException as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def poll_bmkg_gempaterkini(self):
    try:
        return _poll_endpoint(BMKG_ENDPOINTS["recent_m5"])
    except requests.RequestException as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def poll_bmkg_gempadirasakan(self):
    try:
        return _poll_endpoint(BMKG_ENDPOINTS["felt"])
    except requests.RequestException as exc:
        raise self.retry(exc=exc)


@shared_task
def poll_bmkg_all():
    """Poll all three BMKG feeds in one beat tick. Dedup runs inside each upsert."""
    return {
        "autogempa": _poll_endpoint(BMKG_ENDPOINTS["latest"]),
        "gempaterkini": _poll_endpoint(BMKG_ENDPOINTS["recent_m5"]),
        "gempadirasakan": _poll_endpoint(BMKG_ENDPOINTS["felt"]),
    }
