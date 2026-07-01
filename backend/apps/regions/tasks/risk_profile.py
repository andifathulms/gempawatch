"""
Nightly RegionRiskProfile recomputation.

These are expensive spatial aggregations across full history — always
precomputed, never run live on request (except the single-point risk-check).

Runs in two passes: first every region's profile + composite score is computed
and stored, then percentile ranks are assigned by ranking those scores against
each other.
"""
from celery import shared_task
from django.contrib.gis.measure import D
from django.db.models import Avg, Max, Min
from django.db.models.functions import ExtractYear
from django.utils import timezone

from apps.earthquakes.models import EarthquakeEvent
from apps.regions.models import AdminRegion, RegionRiskProfile
from apps.regions.risk_logic import classify_tsunami_risk, find_nearest_fault
from apps.regions.scoring import (
    ScoreInputs,
    compute_composite_score,
    percentile_rank,
    score_to_tier,
)

PROFILE_RADIUS_KM = 100


def compute_profile_for_region(region: AdminRegion) -> RegionRiskProfile:
    """Compute + persist a RegionRiskProfile for a single region (no percentile)."""
    nearby = EarthquakeEvent.objects.filter(
        location__distance_lte=(region.centroid, D(km=PROFILE_RADIUS_KM))
    )

    largest_event = nearby.order_by("-magnitude").first()
    aggregates = nearby.aggregate(
        largest_magnitude=Max("magnitude"),
        avg_depth_km=Avg("depth_km"),
        earliest_year=Min(ExtractYear("event_time")),
        latest_year=Max(ExtractYear("event_time")),
    )

    m4_count = nearby.filter(magnitude__gte=4.0).count()
    shallow_count = nearby.filter(depth_km__lt=70).count()
    total_count = nearby.count()
    shallow_ratio = shallow_count / total_count if total_count else None

    earliest_year = aggregates["earliest_year"]
    latest_year = aggregates["latest_year"]
    coverage_years = (
        (latest_year - earliest_year + 1) if earliest_year and latest_year else 0
    )

    nearest_fault, fault_distance_km = find_nearest_fault(region.centroid)
    tsunami_tier = classify_tsunami_risk(region.is_coastal, region.centroid)

    score = compute_composite_score(
        ScoreInputs(
            m4_count=m4_count,
            coverage_years=coverage_years,
            largest_magnitude=aggregates["largest_magnitude"],
            shallow_ratio=shallow_ratio,
            nearest_fault_distance_km=fault_distance_km,
        )
    )

    profile, _ = RegionRiskProfile.objects.update_or_create(
        region=region,
        defaults={
            "event_count_m4": m4_count,
            "event_count_m5": nearby.filter(magnitude__gte=5.0).count(),
            "event_count_m6": nearby.filter(magnitude__gte=6.0).count(),
            "event_count_m7_plus": nearby.filter(magnitude__gte=7.0).count(),
            "largest_magnitude": aggregates["largest_magnitude"],
            "largest_event": largest_event,
            "avg_depth_km": aggregates["avg_depth_km"],
            "nearest_fault": nearest_fault,
            "nearest_fault_distance_km": fault_distance_km,
            "tsunami_risk_tier": tsunami_tier,
            "composite_score": score,
            "activity_tier": score_to_tier(score),
            "shallow_ratio": shallow_ratio,
            "earliest_event_year": earliest_year,
            "latest_event_year": latest_year,
            "last_updated": timezone.now(),
        },
    )
    return profile


def assign_percentiles() -> None:
    """Second pass: rank every stored composite score to fill activity_percentile."""
    scores = list(
        RegionRiskProfile.objects.filter(composite_score__isnull=False).values_list(
            "composite_score", flat=True
        )
    )
    for profile in RegionRiskProfile.objects.filter(composite_score__isnull=False):
        profile.activity_percentile = percentile_rank(profile.composite_score, scores)
        profile.save(update_fields=["activity_percentile"])


@shared_task
def recompute_region_risk_profiles() -> dict:
    """Rebuild risk profiles for all kabupaten/kota regions, then rank them."""
    regions = AdminRegion.objects.exclude(type=AdminRegion.PROVINSI)
    count = 0
    for region in regions.iterator():
        compute_profile_for_region(region)
        count += 1
    assign_percentiles()
    return {"profiles_computed": count}
