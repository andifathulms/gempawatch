from django.contrib.gis.db import models as gis_models
from django.db import models

from apps.common.models import BaseModel


class AdminRegion(BaseModel):
    """Indonesian administrative region (provinsi / kabupaten / kota)."""

    PROVINSI = "provinsi"
    KABUPATEN = "kabupaten"
    KOTA = "kota"
    TYPE_CHOICES = [
        (PROVINSI, "Provinsi"),
        (KABUPATEN, "Kabupaten"),
        (KOTA, "Kota"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )

    centroid = gis_models.PointField(geography=False)
    # Optional boundary polygon for future choropleth rendering.
    boundary = gis_models.PolygonField(null=True, blank=True)

    # Precomputed flag — whether the region is within ~10km of the coastline.
    is_coastal = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["type", "name"])]

    def __str__(self):
        return f"{self.get_type_display()} {self.name}"


class RegionRiskProfile(BaseModel):
    """Precomputed risk aggregation for a region. Rebuilt nightly via Celery."""

    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    TSUNAMI_TIER_CHOICES = [
        (LOW, "Low"),
        (MODERATE, "Moderate"),
        (HIGH, "High"),
    ]

    region = models.OneToOneField(
        AdminRegion, on_delete=models.CASCADE, related_name="risk_profile"
    )

    event_count_m4 = models.IntegerField(default=0)
    event_count_m5 = models.IntegerField(default=0)
    event_count_m6 = models.IntegerField(default=0)
    event_count_m7_plus = models.IntegerField(default=0)

    largest_magnitude = models.FloatField(null=True, blank=True)
    largest_event = models.ForeignKey(
        "earthquakes.EarthquakeEvent",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    avg_depth_km = models.FloatField(null=True, blank=True)

    nearest_fault = models.ForeignKey(
        "faults.FaultLine", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    nearest_fault_distance_km = models.FloatField(null=True, blank=True)

    # Tsunami tier is nullable: None means "not a coastal region".
    tsunami_risk_tier = models.CharField(
        max_length=10, choices=TSUNAMI_TIER_CHOICES, null=True, blank=True
    )

    # Composite seismic-activity score (0–100) + national percentile rank.
    # This is the single calibrated number surfaced to users, distinct from
    # the tsunami tier. See apps/regions/scoring.py for the transparent formula.
    composite_score = models.FloatField(null=True, blank=True)
    activity_tier = models.CharField(
        max_length=10, choices=TSUNAMI_TIER_CHOICES, null=True, blank=True
    )
    activity_percentile = models.IntegerField(null=True, blank=True)

    # Fraction of nearby events shallower than 70km (more damaging).
    shallow_ratio = models.FloatField(null=True, blank=True)

    # Actual data coverage for this region — used to compute honest per-year
    # frequency and to avoid overstating the historical window.
    earliest_event_year = models.IntegerField(null=True, blank=True)
    latest_event_year = models.IntegerField(null=True, blank=True)

    last_updated = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Risk profile: {self.region.name}"
