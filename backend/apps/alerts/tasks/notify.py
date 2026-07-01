"""
Significant-event notifier. Runs every 5 minutes after the BMKG poll: for each
active LocationWatch, find qualifying new events and email the watcher.

In dev the email backend is the console (settings). No prediction language —
this reports an event that has already occurred.
"""
import logging

from celery import shared_task
from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.core.mail import send_mail

from apps.alerts.models import LocationWatch
from apps.earthquakes.models import EarthquakeEvent

logger = logging.getLogger(__name__)


def _qualifying_events(watch: LocationWatch):
    """New events near a watch that meet its magnitude threshold."""
    qs = (
        EarthquakeEvent.objects.filter(
            location__distance_lte=(watch.location, D(km=watch.radius_km)),
            magnitude__gte=watch.min_magnitude,
        )
        .annotate(distance=Distance("location", watch.location))
        .order_by("-event_time")
    )
    if watch.last_notified_event_time:
        qs = qs.filter(event_time__gt=watch.last_notified_event_time)
    return qs


def _compose(watch: LocationWatch, event: EarthquakeEvent) -> tuple[str, str]:
    place = watch.label or f"lokasi Anda ({watch.latitude:.2f}, {watch.longitude:.2f})"
    subject = f"[GempaWatch] M{event.magnitude:.1f} dekat {place}"
    unsub = f"{settings.FRONTEND_BASE_URL}/unsubscribe/{watch.unsubscribe_token}"
    body = (
        f"Gempa M{event.magnitude:.1f} tercatat dekat {place}.\n\n"
        f"Lokasi   : {event.location_description}\n"
        f"Kedalaman: {event.depth_km:.0f} km\n"
        f"Waktu    : {event.event_time:%d %b %Y %H:%M UTC}\n"
        f"Sumber   : {event.source}\n\n"
        "Ini laporan kejadian yang SUDAH terjadi — bukan prediksi dan bukan "
        "peringatan dini tsunami. Untuk peringatan resmi, rujuk BMKG "
        "(https://www.bmkg.go.id/).\n\n"
        f"Berhenti berlangganan: {unsub}\n"
    )
    return subject, body


@shared_task
def notify_significant_events() -> dict:
    """Email every active watch about qualifying new events. Idempotent per event."""
    sent = 0
    checked = 0
    for watch in LocationWatch.objects.filter(is_active=True).iterator():
        checked += 1
        latest = _qualifying_events(watch).first()
        if latest is None:
            continue
        subject, body = _compose(watch, latest)
        try:
            send_mail(
                subject,
                body,
                settings.DEFAULT_FROM_EMAIL,
                [watch.email],
                fail_silently=False,
            )
        except Exception as exc:  # noqa: BLE001 — one bad send shouldn't stop the batch
            logger.warning("Failed to notify %s: %s", watch.email, exc)
            continue
        watch.last_notified_event_time = latest.event_time
        watch.save(update_fields=["last_notified_event_time"])
        sent += 1
    return {"watches_checked": checked, "emails_sent": sent}
