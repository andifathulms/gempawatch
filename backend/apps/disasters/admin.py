from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import HistoricalDisaster


@admin.register(HistoricalDisaster)
class HistoricalDisasterAdmin(GISModelAdmin):
    list_display = ("name", "event_date", "magnitude", "casualties", "displaced")
    search_fields = ("name", "description")
    date_hierarchy = "event_date"
    prepopulated_fields = {"slug": ("name",)}
