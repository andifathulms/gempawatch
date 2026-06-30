from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import EarthquakeEvent


@admin.register(EarthquakeEvent)
class EarthquakeEventAdmin(GISModelAdmin):
    list_display = (
        "event_time",
        "magnitude",
        "depth_km",
        "source",
        "location_description",
        "potensi_tsunami",
    )
    list_filter = ("source", "potensi_tsunami")
    search_fields = ("location_description", "external_id")
    date_hierarchy = "event_time"
    readonly_fields = ("created_at", "updated_at")
