from django.contrib.gis.db import models as gis_models
from django.db import models

from apps.common.models import BaseModel


class FaultLine(BaseModel):
    """A known geological fault line, stored as a LineString geometry."""

    STRIKE_SLIP = "strike-slip"
    THRUST = "thrust"
    NORMAL = "normal"
    MEGATHRUST = "megathrust"
    FAULT_TYPE_CHOICES = [
        (STRIKE_SLIP, "Strike-slip"),
        (THRUST, "Thrust"),
        (NORMAL, "Normal"),
        (MEGATHRUST, "Megathrust"),
    ]

    name = models.CharField(max_length=200)
    geometry = gis_models.LineStringField()
    fault_type = models.CharField(
        max_length=20, choices=FAULT_TYPE_CHOICES, blank=True
    )
    source_citation = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
