from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from django.db import IntegrityError
from .models import TaskRequest
from tasks.models import Task
from .serializers import TaskRequestSerializer
from notifications.models import Notification
from django.conf import settings
from django.core.mail import get_connection, send_mail
import logging

logger = logging.getLogger(__name__)

def _send_task_email(subject: str, message: str, recipient_email: str):
    """Send task-related email with fallback SMTP strategy."""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        return True, None
    except Exception as primary_exc:
        if settings.EMAIL_BACKEND != 'django.core.mail.backends.smtp.EmailBackend':
            return False, str(primary_exc)
        retry_port = 465 if settings.EMAIL_PORT == 587 else 587
        retry_use_ssl = retry_port == 465
        retry_use_tls = retry_port == 587
        try:
            retry_connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=settings.EMAIL_HOST,
                port=retry_port,
                username=settings.EMAIL_HOST_USER,
                password=settings.EMAIL_HOST_PASSWORD,
                use_tls=retry_use_tls,
                use_ssl=retry_use_ssl,
                fail_silently=False,
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                fail_silently=False,
                connection=retry_connection,
            )
            return True, None
        except Exception as retry_exc:
            logger.exception(
                "Task email send failed. primary=%s retry=%s",
                primary_exc,
                retry_exc,
            )
            return False, str(retry_exc)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_request(request):

    task_id = request.data.get("task_id")
    message = (request.data.get("message") or "").strip()

    if not task_id:
        return Response({"error": "task_id is required"}, status=400)

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    if task.created_by == request.user:
        return Response({"error": "You cannot request your own task"}, status=400)

    if task.status != 'open':
        return Response({"error": "Task is not open"}, status=400)

    if TaskRequest.objects.filter(task=task, requester=request.user).exists():
        return Response({"error": "You already requested this task"}, status=400)

    try:
        task_request = TaskRequest.objects.create(
            task=task,
            requester=request.user,
            message=message,
        )
    except IntegrityError:
        return Response({"error": "You already requested this task"}, status=400)


    # Notify the employer (hirer)
    helper_name = request.user.get_full_name() or request.user.username
    notification_message = f"{helper_name} requested to help with your task: {task.title}"
    if message:
        notification_message += f"\nMessage: {message}"

    Notification.objects.create(
        user=task.created_by,
        message=f'New request for task "{task.title}" from {request.user.username}.',
        link='/requests'
    )

    # Send email to hirer
    hirer_email = getattr(task.created_by, 'email', None)
    if hirer_email:
        subject = f"New Helper Request for Task: {task.title}"
        email_message = f"Hello {task.created_by.get_full_name() or task.created_by.username},\n\nYou have received a new helper request for your task '{task.title}'.\n\nHelper: {helper_name}\nMessage: {message if message else '(No message)'}\n\nPlease review the request in your dashboard."
        _send_task_email(subject, email_message, hirer_email)

    serializer = TaskRequestSerializer(task_request)
    return Response(
        {
            "message": "Request sent successfully",
            "request": serializer.data
        },
        status=201
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_requests(request):
    requests = TaskRequest.objects.filter(requester=request.user).select_related("task").order_by("-created_at")
    serializer = TaskRequestSerializer(requests, many=True)
    return Response(serializer.data)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_my_request(request, request_id):
    try:
        task_request = TaskRequest.objects.get(id=request_id, requester=request.user)
    except TaskRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    if request.method == 'DELETE':
        if task_request.status != "PENDING":
            return Response({"error": "Only pending requests can be deleted"}, status=400)

        task_request.delete()
        return Response({"message": "Request deleted successfully"}, status=200)

    message = (request.data.get("message") or "").strip()

    if task_request.status != "PENDING":
        return Response({"error": "Only pending requests can be edited"}, status=400)

    task_request.message = message
    task_request.save(update_fields=["message", "updated_at"])

    helper_name = request.user.get_full_name() or request.user.username
    Notification.objects.create(
        user=task_request.task.created_by,
        message=(
            f"{helper_name} updated their request message for your task: {task_request.task.title}"
            + (f"\nMessage: {message}" if message else "")
        ),
    )

    serializer = TaskRequestSerializer(task_request)
    return Response({"message": "Request updated successfully", "request": serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_request(request, request_id):

    try:
        task_request = TaskRequest.objects.get(id=request_id, task__created_by=request.user)
    except TaskRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    task_request.status = "ACCEPTED"
    task_request.save()

    task_request.task.status = "in_progress"
    task_request.task.save()


    # Notify the helper
    Notification.objects.create(
        user=task_request.requester,
        message=f'Your request for task "{task_request.task.title}" has been accepted!',
        link='/my-requests'
    )

    # Send email to helper
    helper_email = getattr(task_request.requester, 'email', None)
    if helper_email:
        subject = f"Your Request for Task '{task_request.task.title}' was Accepted"
        email_message = f"Hello {task_request.requester.get_full_name() or task_request.requester.username},\n\nCongratulations! Your request to help with the task '{task_request.task.title}' has been accepted by the hirer.\n\nYou can now proceed with the task."
        _send_task_email(subject, email_message, helper_email)

    return Response({"message": "Request accepted"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_request(request, request_id):

    try:
        task_request = TaskRequest.objects.get(id=request_id, task__created_by=request.user)
    except TaskRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    task_request.status = "REJECTED"
    task_request.save()


    Notification.objects.create(
        user=task_request.requester,
        message=f"Your application for \"{task_request.task.title}\" was not accepted."
    )

    # Send email to helper
    helper_email = getattr(task_request.requester, 'email', None)
    if helper_email:
        subject = f"Your Request for Task '{task_request.task.title}' was Rejected"
        email_message = f"Hello {task_request.requester.get_full_name() or task_request.requester.username},\n\nUnfortunately, your request to help with the task '{task_request.task.title}' was not accepted by the hirer.\n\nYou may look for other available tasks."
        _send_task_email(subject, email_message, helper_email)

    return Response({"message": "Request rejected"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def received_requests(request):
    requests = TaskRequest.objects.filter(task__created_by=request.user).select_related("task", "requester").order_by("-created_at")
    serializer = TaskRequestSerializer(requests, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reply_to_request(request, request_id):
    hirer_reply = (request.data.get("hirer_reply") or "").strip()

    try:
        task_request = TaskRequest.objects.select_related("task", "requester").get(
            id=request_id,
            task__created_by=request.user,
        )
    except TaskRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    task_request.hirer_reply = hirer_reply
    task_request.save(update_fields=["hirer_reply", "updated_at"])

    hirer_name = request.user.get_full_name() or request.user.username
    notification_message = f"{hirer_name} replied to your request for task: {task_request.task.title}"
    if hirer_reply:
        notification_message += f"\nReply: {hirer_reply}"

    Notification.objects.create(
        user=task_request.requester,
        message=notification_message,
    )

    serializer = TaskRequestSerializer(task_request)
    return Response({"message": "Reply sent successfully", "request": serializer.data})
