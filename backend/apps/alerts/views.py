from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LocationWatch
from .serializers import LocationWatchSerializer


class SubscribeView(APIView):
    """POST /api/alerts/subscribe/ — opt in to significant-event emails."""

    def post(self, request):
        serializer = LocationWatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        watch = serializer.save()
        return Response(
            LocationWatchSerializer(watch).data, status=status.HTTP_201_CREATED
        )


class UnsubscribeView(APIView):
    """
    GET/POST /api/alerts/unsubscribe/{token}/ — one-click opt-out, no login.
    Idempotent: unknown/already-inactive tokens still return 200.
    """

    def get(self, request, token):
        return self._deactivate(token)

    def post(self, request, token):
        return self._deactivate(token)

    def _deactivate(self, token):
        LocationWatch.objects.filter(unsubscribe_token=token).update(is_active=False)
        return Response({"detail": "Langganan dinonaktifkan."})
