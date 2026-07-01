"""Celery application for GempaWatch.

Beat schedule:
  * Every 5 minutes  — poll BMKG feeds + deduplicate against USGS backfill
  * Daily 02:00 WIB  — sync recent USGS + recompute region risk profiles
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("gempawatch")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "poll-bmkg-every-5-min": {
        "task": "apps.earthquakes.tasks.bmkg.poll_bmkg_all",
        "schedule": crontab(minute="*/5"),
    },
    "notify-location-watches-every-5-min": {
        "task": "apps.alerts.tasks.notify.notify_significant_events",
        "schedule": crontab(minute="*/5"),
    },
    "sync-usgs-recent-daily": {
        "task": "apps.earthquakes.tasks.usgs.sync_usgs_recent",
        "schedule": crontab(hour=2, minute=0),  # 02:00 WIB (CELERY_TIMEZONE=Asia/Jakarta)
    },
    "recompute-risk-profiles-daily": {
        "task": "apps.regions.tasks.risk_profile.recompute_region_risk_profiles",
        "schedule": crontab(hour=2, minute=30),
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
