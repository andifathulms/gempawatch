from django.contrib.gis.geos import Point
from rest_framework import serializers

from .models import LocationWatch


class LocationWatchSerializer(serializers.ModelSerializer):
    """Create/read serializer for a location watch subscription."""

    lat = serializers.FloatField(min_value=-90, max_value=90, write_only=True)
    lng = serializers.FloatField(min_value=-180, max_value=180, write_only=True)

    class Meta:
        model = LocationWatch
        fields = [
            "id",
            "email",
            "label",
            "lat",
            "lng",
            "latitude",
            "longitude",
            "radius_km",
            "min_magnitude",
            "is_active",
            "unsubscribe_token",
            "created_at",
        ]
        read_only_fields = [
            "latitude",
            "longitude",
            "is_active",
            "unsubscribe_token",
            "created_at",
        ]

    def validate_radius_km(self, value):
        if not 5 <= value <= 500:
            raise serializers.ValidationError("radius_km must be between 5 and 500.")
        return value

    def validate_min_magnitude(self, value):
        if not 3.0 <= value <= 9.0:
            raise serializers.ValidationError("min_magnitude must be between 3.0 and 9.0.")
        return value

    def create(self, validated_data):
        lat = validated_data.pop("lat")
        lng = validated_data.pop("lng")
        validated_data["latitude"] = lat
        validated_data["longitude"] = lng
        validated_data["location"] = Point(lng, lat, srid=4326)
        # Re-subscribing the same email+location reactivates the existing watch.
        watch, _ = LocationWatch.objects.update_or_create(
            email=validated_data["email"],
            latitude=lat,
            longitude=lng,
            defaults={**validated_data, "is_active": True},
        )
        return watch
