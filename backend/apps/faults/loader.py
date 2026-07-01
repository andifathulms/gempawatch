"""Load static fault line GeoJSON into the FaultLine model."""
import json
from pathlib import Path

from django.conf import settings
from django.contrib.gis.geos import LineString

from .models import FaultLine

DATA_FILE = Path(settings.BASE_DIR) / "data" / "fault_lines.geojson"


def load_fault_lines(path: Path = DATA_FILE) -> int:
    """Upsert fault lines from the GeoJSON file. Returns count loaded."""
    with open(path) as fh:
        collection = json.load(fh)

    count = 0
    for feature in collection["features"]:
        props = feature["properties"]
        geometry = LineString(feature["geometry"]["coordinates"], srid=4326)
        FaultLine.objects.update_or_create(
            name=props["name"],
            defaults={
                "geometry": geometry,
                "fault_type": props.get("fault_type", ""),
                "source_citation": props.get("source_citation", ""),
            },
        )
        count += 1
    return count
