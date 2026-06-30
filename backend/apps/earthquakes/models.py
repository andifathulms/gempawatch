from django.contrib.gis.db import models as gis_models
from django.db import models

from apps.common.models import BaseModel


class EarthquakeEvent(BaseModel):
    """
    A single earthquake event, sourced from either BMKG (live) or USGS
    (historical). Location is a PostGIS point (lon, lat order). When the same
    physical quake is reported by both sources, the BMKG record wins.
    """

    BMKG = "BMKG"
    USGS = "USGS"
    SOURCE_CHOICES = [(BMKG, "BMKG"), (USGS, "USGS")]

    # Source-specific unique id. For BMKG (no native id) we hash DateTime+Coordinates.
    external_id = models.CharField(max_length=64, unique=True, db_index=True)
    source = models.CharField(max_length=8, choices=SOURCE_CHOICES, db_index=True)

    event_time = models.DateTimeField(db_index=True)
    magnitude = models.FloatField(db_index=True)
    depth_km = models.FloatField()

    # PostGIS point — stored lon/lat. Keep raw lat/lon too for convenience.
    location = gis_models.PointField(geography=False)
    latitude = models.FloatField()
    longitude = models.FloatField()

    location_description = models.TextField(blank=True)
    region = models.ForeignKey(
        "regions.AdminRegion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
    )

    felt_reports = models.TextField(null=True, blank=True)  # BMKG "Dirasakan"
    potensi_tsunami = models.BooleanField(null=True, blank=True)
    shakemap_url = models.URLField(max_length=500, null=True, blank=True)

    raw_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-event_time"]
        indexes = [
            models.Index(fields=["-event_time", "magnitude"]),
            models.Index(fields=["source", "-event_time"]),
        ]

    def __str__(self):
        return f"M{self.magnitude} {self.location_description[:40]} ({self.source})"

    @property
    def is_preliminary(self) -> bool:
        """Events younger than 1 hour may still be revised by BMKG."""
        from datetime import timedelta

        from django.utils import timezone

        return timezone.now() - self.event_time < timedelta(hours=1)
