from django.contrib.gis.admin import GISModelAdmin
from django.contrib import admin

from .models import FaultLine


@admin.register(FaultLine)
class FaultLineAdmin(GISModelAdmin):
    list_display = ("name", "fault_type")
    list_filter = ("fault_type",)
    search_fields = ("name",)
