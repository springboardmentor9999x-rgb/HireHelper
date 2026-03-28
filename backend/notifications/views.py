from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import NotificationSerializer


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):

    notifications = Notification.objects.filter(user=request.user)

    serializer = NotificationSerializer(notifications, many=True)

    return Response(serializer.data)