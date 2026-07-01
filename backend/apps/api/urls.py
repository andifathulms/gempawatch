from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DisasterViewSet,
    EarthquakeViewSet,
    FaultViewSet,
    RegionViewSet,
    RiskCheckView,
    TsunamiRiskView,
)

router = DefaultRouter()
router.register(r"earthquakes", EarthquakeViewSet, basename="earthquake")
router.register(r"regions", RegionViewSet, basename="region")
router.register(r"faults", FaultViewSet, basename="fault")
router.register(r"disasters", DisasterViewSet, basename="disaster")

urlpatterns = [
    path("", include(router.urls)),
    path("tsunami-risk/coastal-zones/", TsunamiRiskView.as_view(), name="tsunami-coastal-zones"),
    path("risk-check/", RiskCheckView.as_view(), name="risk-check"),
    path("alerts/", include("apps.alerts.urls")),
]
