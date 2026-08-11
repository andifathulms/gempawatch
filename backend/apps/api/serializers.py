"""DRF serializers. Geo endpoints use GeoFeatureModelSerializer (GeoJSON)."""
from django.conf import settings
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from apps.disasters.models import HistoricalDisaster
from apps.earthquakes.models import EarthquakeEvent
from apps.faults.models import FaultLine
from apps.regions.models import AdminRegion, RegionRiskProfile


def source_attribution_for(source: str) -> str:
    return settings.SOURCE_ATTRIBUTION.get(source, "")


class EarthquakeEventSerializer(serializers.ModelSerializer):
    """Plain JSON event serializer. Always carries source attribution."""

    source_attribution = serializers.SerializerMethodField()
    is_preliminary = serializers.BooleanField(read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True, default=None)

    class Meta:
        model = EarthquakeEvent
        fields = [
            "id",
            "external_id",
            "source",
            "source_attribution",
            "event_time",
            "magnitude",
            "depth_km",
            "latitude",
            "longitude",
            "location_description",
            "region",
            "region_name",
            "felt_reports",
            "potensi_tsunami",
            "shakemap_url",
            "is_preliminary",
        ]

    def get_source_attribution(self, obj) -> str:
        return source_attribution_for(obj.source)


class EarthquakeEventGeoSerializer(GeoFeatureModelSerializer):
    """GeoJSON serializer for map layers (Feature geometry = point location)."""

    source_attribution = serializers.SerializerMethodField()
    is_preliminary = serializers.BooleanField(read_only=True)

    class Meta:
        model = EarthquakeEvent
        geo_field = "location"
        fields = [
            "id",
            "source",
            "source_attribution",
            "event_time",
            "magnitude",
            "depth_km",
            "location_description",
            "felt_reports",
            "potensi_tsunami",
            "is_preliminary",
        ]

    def get_source_attribution(self, obj) -> str:
        return source_attribution_for(obj.source)


class FaultLineSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = FaultLine
        geo_field = "geometry"
        fields = ["id", "name", "fault_type", "source_citation"]


class AdminRegionSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = AdminRegion
        fields = ["id", "name", "slug", "type", "parent", "is_coastal", "latitude", "longitude"]

    def get_latitude(self, obj) -> float:
        return obj.centroid.y

    def get_longitude(self, obj) -> float:
        return obj.centroid.x


class RegionRiskProfileSerializer(serializers.ModelSerializer):
    region = AdminRegionSerializer(read_only=True)
    nearest_fault_name = serializers.CharField(
        source="nearest_fault.name", read_only=True, default=None
    )
    largest_event = EarthquakeEventSerializer(read_only=True)
    activity_percentile_basis = serializers.SerializerMethodField()

    def get_activity_percentile_basis(self, obj) -> dict:
        """
        How many regions the percentile was ranked against.

        Without it, "82nd percentile" reads as a claim about Indonesia, when it
        is a rank against the regions this deployment has scored — currently two
        dozen, themselves skewed towards already-seismic places. The frontend
        refuses to render the percentile without this, so the denominator cannot
        be quietly dropped.

        Counted once per serializer instance rather than per row, so a
        leaderboard of N regions does not issue N identical counts.
        """
        if not hasattr(self, "_scored_region_count"):
            self._scored_region_count = RegionRiskProfile.objects.filter(
                composite_score__isnull=False
            ).count()
        return {"region_count": self._scored_region_count}

    class Meta:
        model = RegionRiskProfile
        fields = [
            "region",
            "event_count_m4",
            "event_count_m5",
            "event_count_m6",
            "event_count_m7_plus",
            "largest_magnitude",
            "largest_event",
            "avg_depth_km",
            "nearest_fault",
            "nearest_fault_name",
            "nearest_fault_distance_km",
            "tsunami_risk_tier",
            "composite_score",
            "activity_tier",
            "activity_percentile",
            "activity_percentile_basis",
            "shallow_ratio",
            "earliest_event_year",
            "latest_event_year",
            "last_updated",
        ]


class HistoricalDisasterSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = HistoricalDisaster
        fields = [
            "id",
            "name",
            "slug",
            "event_date",
            "magnitude",
            "latitude",
            "longitude",
            "casualties",
            "displaced",
            "description",
            "image_url",
            "source_links",
        ]

    def get_latitude(self, obj) -> float:
        return obj.epicenter.y

    def get_longitude(self, obj) -> float:
        return obj.epicenter.x


class RiskCheckRequestSerializer(serializers.Serializer):
    """Input validation for POST /api/risk-check/."""

    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)
