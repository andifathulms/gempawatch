"""
Nightly RegionRiskProfile recomputation.

These are expensive spatial aggregations across full history — always
precomputed, never run live on request (except the single-point risk-check).
"""
from celery import shared_task
from django.contrib.gis.measure import D
from django.db.models import Avg, Max
from django.utils import timezone

from apps.earthquakes.models import EarthquakeEvent
from apps.regions.models import AdminRegion, RegionRiskProfile
from apps.regions.risk_logic import classify_tsunami_risk, find_nearest_fault

PROFILE_RADIUS_KM = 100


def compute_profile_for_region(region: AdminRegion) -> RegionRiskProfile:
    """Compute + persist a RegionRiskProfile for a single region."""
    nearby = EarthquakeEvent.objects.filter(
        location__distance_lte=(region.centroid, D(km=PROFILE_RADIUS_KM))
    )

    largest_event = nearby.order_by("-magnitude").first()
    aggregates = nearby.aggregate(
        largest_magnitude=Max("magnitude"),
        avg_depth_km=Avg("depth_km"),
    )

    nearest_fault, fault_distance_km = find_nearest_fault(region.centroid)
    tsunami_tier = classify_tsunami_risk(region.is_coastal, region.centroid)

    profile, _ = RegionRiskProfile.objects.update_or_create(
        region=region,
        defaults={
            "event_count_m4": nearby.filter(magnitude__gte=4.0).count(),
            "event_count_m5": nearby.filter(magnitude__gte=5.0).count(),
            "event_count_m6": nearby.filter(magnitude__gte=6.0).count(),
            "event_count_m7_plus": nearby.filter(magnitude__gte=7.0).count(),
            "largest_magnitude": aggregates["largest_magnitude"],
            "largest_event": largest_event,
            "avg_depth_km": aggregates["avg_depth_km"],
            "nearest_fault": nearest_fault,
            "nearest_fault_distance_km": fault_distance_km,
            "tsunami_risk_tier": tsunami_tier,
            "last_updated": timezone.now(),
        },
    )
    return profile


@shared_task
def recompute_region_risk_profiles() -> dict:
    """Rebuild risk profiles for all kabupaten/kota regions."""
    regions = AdminRegion.objects.exclude(type=AdminRegion.PROVINSI)
    count = 0
    for region in regions.iterator():
        compute_profile_for_region(region)
        count += 1
    return {"profiles_computed": count}
