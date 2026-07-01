import secrets

from django.contrib.gis.db import models as gis_models
from django.db import models

from apps.common.models import BaseModel


def _make_token() -> str:
    return secrets.token_urlsafe(24)


class LocationWatch(BaseModel):
    """
    An opt-in watch: email me when a significant earthquake occurs near a saved
    location. The retention primitive — a reason to come back after a quake.

    Deliberately minimal: no user accounts, email + point + thresholds only.
    A per-row unsubscribe token allows one-click opt-out (no login).
    """

    email = models.EmailField(db_index=True)
    label = models.CharField(max_length=120, blank=True)

    location = gis_models.PointField(geography=False)
    latitude = models.FloatField()
    longitude = models.FloatField()

    radius_km = models.FloatField(default=50)
    min_magnitude = models.FloatField(default=5.0)

    is_active = models.BooleanField(default=True)
    unsubscribe_token = models.CharField(
        max_length=64, unique=True, default=_make_token, editable=False
    )

    # Guards against re-notifying for the same event on every poll.
    last_notified_event_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["email", "latitude", "longitude"],
                name="unique_watch_per_email_location",
            )
        ]

    def __str__(self):
        return f"{self.email} @ ({self.latitude:.2f}, {self.longitude:.2f})"
