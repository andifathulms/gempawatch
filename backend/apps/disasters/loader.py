"""Load curated historical disaster dataset into HistoricalDisaster."""
import json
from datetime import date
from pathlib import Path

from django.conf import settings
from django.contrib.gis.geos import Point

from .models import HistoricalDisaster

DATA_FILE = Path(settings.BASE_DIR) / "data" / "historical_disasters.json"


def load_historical_disasters(path: Path = DATA_FILE) -> int:
    """Upsert historical disasters from the JSON file. Returns count loaded."""
    with open(path) as fh:
        records = json.load(fh)

    count = 0
    for rec in records:
        HistoricalDisaster.objects.update_or_create(
            slug=rec["slug"],
            defaults={
                "name": rec["name"],
                "event_date": date.fromisoformat(rec["event_date"]),
                "magnitude": rec.get("magnitude"),
                "epicenter": Point(rec["longitude"], rec["latitude"], srid=4326),
                "casualties": rec.get("casualties"),
                "displaced": rec.get("displaced"),
                "description": rec.get("description", ""),
                "image_url": rec.get("image_url"),
                "source_links": rec.get("source_links", []),
            },
        )
        count += 1
    return count
