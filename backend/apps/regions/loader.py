"""Load Indonesian admin region centroids from GeoJSON into AdminRegion."""
import json
from pathlib import Path

from django.conf import settings
from django.contrib.gis.geos import Point
from django.utils.text import slugify

from .models import AdminRegion

DATA_FILE = Path(settings.BASE_DIR) / "data" / "admin_regions.geojson"


def load_admin_regions(path: Path = DATA_FILE) -> int:
    """Upsert admin regions from the GeoJSON file. Returns count loaded."""
    with open(path) as fh:
        collection = json.load(fh)

    count = 0
    for feature in collection["features"]:
        props = feature["properties"]
        lon, lat = feature["geometry"]["coordinates"]
        AdminRegion.objects.update_or_create(
            slug=slugify(props["name"]),
            defaults={
                "name": props["name"],
                "type": props["type"],
                "centroid": Point(lon, lat, srid=4326),
                "is_coastal": props.get("is_coastal", False),
            },
        )
        count += 1
    return count
