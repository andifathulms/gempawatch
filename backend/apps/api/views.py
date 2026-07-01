"""
DRF views for all GempaWatch endpoints. Public, read-only, paginated
(except the single POST risk-check).
"""
from datetime import timedelta

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.disasters.models import HistoricalDisaster
from apps.earthquakes.models import EarthquakeEvent
from apps.faults.models import FaultLine
from apps.regions.models import AdminRegion, RegionRiskProfile
from apps.regions.report import build_point_risk_report

from .serializers import (
    AdminRegionSerializer,
    EarthquakeEventGeoSerializer,
    EarthquakeEventSerializer,
    FaultLineSerializer,
    HistoricalDisasterSerializer,
    RegionRiskProfileSerializer,
    RiskCheckRequestSerializer,
)


class EarthquakeViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    /api/earthquakes/{id}/   single event detail
    /api/earthquakes/live/   last 24h, merged BMKG+USGS (deduplicated at ingest)
    /api/earthquakes/felt/   BMKG "dirasakan" feed
    """

    queryset = EarthquakeEvent.objects.select_related("region").all()
    serializer_class = EarthquakeEventSerializer

    @action(detail=False)
    def live(self, request):
        since = timezone.now() - timedelta(hours=24)
        events = self.get_queryset().filter(event_time__gte=since).order_by("-event_time")
        fmt = request.query_params.get("format_geo")
        if fmt == "geojson":
            return Response(EarthquakeEventGeoSerializer(events, many=True).data)
        page = self.paginate_queryset(events)
        return self.get_paginated_response(
            EarthquakeEventSerializer(page, many=True).data
        )

    @action(detail=False)
    def felt(self, request):
        events = (
            self.get_queryset()
            .filter(felt_reports__isnull=False)
            .exclude(felt_reports="")
            .order_by("-event_time")
        )
        page = self.paginate_queryset(events)
        return self.get_paginated_response(
            EarthquakeEventSerializer(page, many=True).data
        )


class RegionViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    /api/regions/                       list regions
    /api/regions/{id}/                  region detail
    /api/regions/{id}/risk-profile/     full computed risk profile
    /api/regions/{id}/timeline/         historical event scatter data
    /api/regions/search/?q=             search by name
    /api/regions/nearest/?lat=&lng=     resolve coordinates to region
    """

    queryset = AdminRegion.objects.all()
    serializer_class = AdminRegionSerializer
    lookup_field = "slug"

    @action(detail=True, url_path="risk-profile")
    def risk_profile(self, request, slug=None):
        region = self.get_object()
        profile = RegionRiskProfile.objects.filter(region=region).first()
        if profile is None:
            return Response(
                {"detail": "Risk profile not yet computed for this region."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(RegionRiskProfileSerializer(profile).data)

    @action(detail=True)
    def timeline(self, request, slug=None):
        """All events within 100km of the region centroid, as scatter points."""
        from django.contrib.gis.measure import D

        region = self.get_object()
        events = (
            EarthquakeEvent.objects.filter(
                location__distance_lte=(region.centroid, D(km=100))
            )
            .order_by("event_time")
            .values("id", "event_time", "magnitude", "depth_km", "source")
        )
        return Response(
            {
                "region": AdminRegionSerializer(region).data,
                "events": list(events),
                "source_attribution": [
                    "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
                    "Data: United States Geological Survey (USGS)",
                ],
            }
        )

    @action(detail=False)
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        regions = self.get_queryset()
        if query:
            regions = regions.filter(name__icontains=query)
        regions = regions[:20]
        return Response(AdminRegionSerializer(regions, many=True).data)

    @action(detail=False)
    def nearest(self, request):
        lat, lng = request.query_params.get("lat"), request.query_params.get("lng")
        if lat is None or lng is None:
            return Response(
                {"detail": "lat and lng query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        point = Point(float(lng), float(lat), srid=4326)
        region = (
            AdminRegion.objects.annotate(distance=Distance("centroid", point))
            .order_by("distance")
            .first()
        )
        if region is None:
            return Response({"detail": "No regions loaded."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminRegionSerializer(region).data)

    @action(detail=False)
    def leaderboard(self, request):
        """
        Regions ranked by composite seismic-activity score — shareable listicle
        content ("10 kabupaten paling aktif"). ?limit= (default 10), ?order=asc
        for the least-active tail.
        """
        try:
            limit = min(int(request.query_params.get("limit", 10)), 50)
        except ValueError:
            limit = 10
        order = "composite_score" if request.query_params.get("order") == "asc" else "-composite_score"

        profiles = (
            RegionRiskProfile.objects.filter(composite_score__isnull=False)
            .select_related("region")
            .order_by(order)[:limit]
        )
        rows = [
            {
                "rank": i + 1,
                "region_name": p.region.name,
                "slug": p.region.slug,
                "type": p.region.type,
                "composite_score": p.composite_score,
                "activity_tier": p.activity_tier,
                "activity_percentile": p.activity_percentile,
                "event_count_m4": p.event_count_m4,
                "largest_magnitude": p.largest_magnitude,
                "tsunami_risk_tier": p.tsunami_risk_tier,
            }
            for i, p in enumerate(profiles)
        ]
        return Response({"results": rows, "count": len(rows)})

    @action(detail=False)
    def compare(self, request):
        """Side-by-side risk profiles for 2–4 regions. ?slugs=a,b,c"""
        slugs = [s for s in request.query_params.get("slugs", "").split(",") if s]
        if not 2 <= len(slugs) <= 4:
            return Response(
                {"detail": "Provide 2 to 4 region slugs via ?slugs=a,b."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profiles = RegionRiskProfile.objects.filter(
            region__slug__in=slugs
        ).select_related("region", "nearest_fault")
        by_slug = {p.region.slug: p for p in profiles}
        # Preserve requested order; skip unknown slugs silently.
        ordered = [by_slug[s] for s in slugs if s in by_slug]
        return Response(RegionRiskProfileSerializer(ordered, many=True).data)


class FaultViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    /api/faults/                    all fault lines as GeoJSON FeatureCollection
    /api/faults/nearest/?lat=&lng=  nearest fault to a point
    """

    queryset = FaultLine.objects.all()
    serializer_class = FaultLineSerializer
    pagination_class = None  # return the full FeatureCollection for the map layer

    @action(detail=False)
    def nearest(self, request):
        lat, lng = request.query_params.get("lat"), request.query_params.get("lng")
        if lat is None or lng is None:
            return Response(
                {"detail": "lat and lng query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        point = Point(float(lng), float(lat), srid=4326)
        fault = (
            FaultLine.objects.annotate(distance=Distance("geometry", point))
            .order_by("distance")
            .first()
        )
        if fault is None:
            return Response({"detail": "No faults loaded."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "id": fault.id,
                "name": fault.name,
                "fault_type": fault.fault_type,
                "distance_km": round(fault.distance.km, 2),
            }
        )


class TsunamiRiskView(APIView):
    """/api/tsunami-risk/coastal-zones/ — coastal regions with their tsunami tier."""

    def get(self, request):
        profiles = (
            RegionRiskProfile.objects.filter(region__is_coastal=True)
            .exclude(tsunami_risk_tier__isnull=True)
            .select_related("region")
        )
        data = [
            {
                "region_id": p.region_id,
                "region_name": p.region.name,
                "slug": p.region.slug,
                "latitude": p.region.centroid.y,
                "longitude": p.region.centroid.x,
                "tsunami_risk_tier": p.tsunami_risk_tier,
            }
            for p in profiles
        ]
        return Response(
            {
                "zones": data,
                "methodology": (
                    "Tier berdasarkan pola historis: gempa dangkal (<70km), "
                    "M>=6.5, dalam radius 150km. Bukan peringatan resmi — "
                    "rujuk sistem peringatan dini tsunami BMKG."
                ),
            }
        )


class DisasterViewSet(
    mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """
    /api/disasters/timeline/   curated historical disaster list
    /api/disasters/{id}/       single disaster detail
    """

    queryset = HistoricalDisaster.objects.all()
    serializer_class = HistoricalDisasterSerializer

    @action(detail=False)
    def timeline(self, request):
        disasters = self.get_queryset().order_by("-event_date")
        return Response(HistoricalDisasterSerializer(disasters, many=True).data)


class MetaView(APIView):
    """
    GET /api/meta/ — dataset coverage + counts. Powers honest, self-updating
    copy on the About page instead of a hardcoded "50 years" claim.
    """

    def get(self, request):
        from django.db.models import Max, Min
        from django.db.models.functions import ExtractYear

        agg = EarthquakeEvent.objects.aggregate(
            earliest=Min(ExtractYear("event_time")),
            latest=Max(ExtractYear("event_time")),
        )
        return Response(
            {
                "event_count": EarthquakeEvent.objects.count(),
                "earliest_year": agg["earliest"],
                "latest_year": agg["latest"],
                "coverage_years": (
                    agg["latest"] - agg["earliest"] + 1
                    if agg["earliest"] and agg["latest"]
                    else 0
                ),
                "region_count": AdminRegion.objects.count(),
                "source_attribution": [
                    "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
                    "Data: United States Geological Survey (USGS)",
                ],
            }
        )


class RiskCheckView(APIView):
    """POST /api/risk-check/ — body {lat, lng} → full live risk report."""

    def post(self, request):
        serializer = RiskCheckRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = build_point_risk_report(
            latitude=serializer.validated_data["lat"],
            longitude=serializer.validated_data["lng"],
        )
        return Response(report)
