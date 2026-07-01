"""Reverse-geocode a point to the nearest AdminRegion via PostGIS distance."""
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point

from .models import AdminRegion


def nearest_region(point: Point) -> AdminRegion | None:
    """Return the AdminRegion whose centroid is closest to `point`, or None."""
    return (
        AdminRegion.objects.annotate(distance=Distance("centroid", point))
        .order_by("distance")
        .first()
    )
