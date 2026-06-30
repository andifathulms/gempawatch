from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import AdminRegion, RegionRiskProfile


@admin.register(AdminRegion)
class AdminRegionAdmin(GISModelAdmin):
    list_display = ("name", "type", "parent", "is_coastal")
    list_filter = ("type", "is_coastal")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(RegionRiskProfile)
class RegionRiskProfileAdmin(admin.ModelAdmin):
    list_display = (
        "region",
        "event_count_m4",
        "event_count_m5",
        "event_count_m6",
        "largest_magnitude",
        "tsunami_risk_tier",
        "last_updated",
    )
    list_filter = ("tsunami_risk_tier",)
    search_fields = ("region__name",)
