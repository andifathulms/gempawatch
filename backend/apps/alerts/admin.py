from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import LocationWatch


@admin.register(LocationWatch)
class LocationWatchAdmin(GISModelAdmin):
    list_display = (
        "email",
        "label",
        "min_magnitude",
        "radius_km",
        "is_active",
        "last_notified_event_time",
    )
    list_filter = ("is_active",)
    search_fields = ("email", "label")
