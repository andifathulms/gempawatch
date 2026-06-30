from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.common.models import BaseModel


class HistoricalDisaster(BaseModel):
    """
    Curated archive of major Indonesian earthquake/tsunami disasters
    (Aceh 2004, Yogyakarta 2006, Palu 2018, ...). Manually sourced and verified.
    """

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    event_date = models.DateField()
    magnitude = models.FloatField(null=True, blank=True)
    epicenter = gis_models.PointField()

    casualties = models.IntegerField(null=True, blank=True)
    displaced = models.IntegerField(null=True, blank=True)

    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, null=True, blank=True)  # CC-licensed only
    source_links = ArrayField(
        models.URLField(max_length=500), default=list, blank=True
    )

    class Meta:
        ordering = ["-event_date"]

    def __str__(self):
        return f"{self.name} ({self.event_date.year})"
