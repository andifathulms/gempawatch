from django.urls import path

from .views import SubscribeView, UnsubscribeView

urlpatterns = [
    path("subscribe/", SubscribeView.as_view(), name="alerts-subscribe"),
    path(
        "unsubscribe/<str:token>/",
        UnsubscribeView.as_view(),
        name="alerts-unsubscribe",
    ),
]
