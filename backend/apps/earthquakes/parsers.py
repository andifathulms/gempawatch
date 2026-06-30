"""
Pure parsing helpers for BMKG and USGS payloads → normalized event dicts.

Kept side-effect free (no DB) so they are easy to unit test. The output dict
matches EarthquakeEvent field names and is consumed by tasks/dedup.upsert_event.
"""
import hashlib
from datetime import datetime, timezone

from django.contrib.gis.geos import Point


def generate_bmkg_external_id(datetime_str: str, coordinates: str) -> str:
    """BMKG provides no native event id — hash DateTime + Coordinates."""
    raw = f"BMKG-{datetime_str}-{coordinates}"
    return hashlib.md5(raw.encode()).hexdigest()


def _parse_depth(kedalaman: str) -> float:
    """'10 km' -> 10.0 ; tolerates stray whitespace and 'Km' casing."""
    return float(kedalaman.lower().replace("km", "").strip())


def parse_bmkg_event(gempa: dict) -> dict:
    """
    Normalize a single BMKG `gempa` object into an EarthquakeEvent kwargs dict.

    BMKG quirks handled here:
      * Coordinates are "lat,lon" — PostGIS Point wants (lon, lat), so flip.
      * Depth is "<n> km" text.
      * Potensi text containing "tsunami" => potensi_tsunami=True.
      * Shakemap is a bare filename — prefix to a full URL.
    """
    coordinates = gempa["Coordinates"].strip()
    lat_str, lon_str = coordinates.split(",")
    latitude, longitude = float(lat_str), float(lon_str)

    datetime_str = gempa["DateTime"]
    event_time = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))

    potensi = gempa.get("Potensi", "") or ""
    shakemap = gempa.get("Shakemap")
    shakemap_url = (
        f"https://data.bmkg.go.id/DataMKG/TEWS/{shakemap}" if shakemap else None
    )

    return {
        "external_id": generate_bmkg_external_id(datetime_str, coordinates),
        "source": "BMKG",
        "event_time": event_time,
        "magnitude": float(gempa["Magnitude"]),
        "depth_km": _parse_depth(gempa["Kedalaman"]),
        "location": Point(longitude, latitude, srid=4326),
        "latitude": latitude,
        "longitude": longitude,
        "location_description": gempa.get("Wilayah", ""),
        "felt_reports": gempa.get("Dirasakan") or None,
        "potensi_tsunami": "tsunami" in potensi.lower(),
        "shakemap_url": shakemap_url,
        "raw_data": gempa,
    }


def parse_usgs_feature(feature: dict) -> dict:
    """
    Normalize a USGS GeoJSON Feature into an EarthquakeEvent kwargs dict.

    geometry.coordinates = [lon, lat, depth_km]  (depth lives in coordinates[2])
    properties.time is epoch milliseconds (UTC).
    """
    props = feature["properties"]
    lon, lat, depth_km = feature["geometry"]["coordinates"]

    event_time = datetime.fromtimestamp(props["time"] / 1000, tz=timezone.utc)

    return {
        "external_id": f"USGS-{feature['id']}",
        "source": "USGS",
        "event_time": event_time,
        "magnitude": float(props["mag"]),
        "depth_km": float(depth_km),
        "location": Point(lon, lat, srid=4326),
        "latitude": lat,
        "longitude": lon,
        "location_description": props.get("place", "") or "",
        "felt_reports": None,
        "potensi_tsunami": bool(props.get("tsunami", 0)),
        "shakemap_url": None,
        "raw_data": {"id": feature["id"], "properties": props},
    }
