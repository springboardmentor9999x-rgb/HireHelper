from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, Review
from .serializers import TaskSerializer, ReviewSerializer
from request.models import TaskRequest
from notifications.models import Notification


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    # Step 1: Deserialize the raw JSON data from the frontend
    serializer = TaskSerializer(data=request.data, context={"request": request})

    # Step 2: Validate the payload against our model rules
    if serializer.is_valid():
        # Step 3: Automatically assign the currently authenticated user as the task creator
        serializer.save(created_by=request.user)
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_feed(request):
    # Fetch all tasks that haven't been completed yet to populate the global feed
    tasks = Task.objects.filter(status="open")
    
    # Serialize the QuerySet into JSON. many=True since we are processing a list.
    serializer = TaskSerializer(tasks, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tasks(request):
    # Fetch tasks strictly tied to the logged-in user for their personal dashboard
    tasks = Task.objects.filter(created_by=request.user)
    serializer = TaskSerializer(tasks, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, task_id):
    import logging
    logger = logging.getLogger(__name__)
    try:
        task = Task.objects.get(id=task_id, created_by=request.user)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    # Log incoming data for debugging
    logger.info(f"request.data: {request.data}")
    logger.info(f"request.FILES: {request.FILES}")

    # Use request.data for both JSON and multipart
    serializer = TaskSerializer(task, data=request.data, partial=True, context={"request": request})

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, task_id):
    try:
        # Security Check: Ensure the user actually owns the task before deleting
        task = Task.objects.get(id=task_id, created_by=request.user)
    except Task.DoesNotExist:
        # Return standard 404 if someone tries to delete a missing or unauthorized task
        return Response({"error": "Task not found"}, status=404)

    task.delete()
    return Response({"message": "Task deleted successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id, created_by=request.user)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    if task.status == 'completed':
        return Response({"error": "Task is already completed"}, status=400)

    if task.status != 'in_progress':
        return Response({"error": "Only in-progress tasks can be marked completed"}, status=400)

    task.status = 'completed'
    task.save(update_fields=['status', 'updated_at'])

    accepted_requests = TaskRequest.objects.filter(task=task, status='ACCEPTED').select_related('requester')
    for task_request in accepted_requests:
        task_request.status = 'COMPLETED'
        task_request.save(update_fields=['status', 'updated_at'])

        Notification.objects.create(
            user=task_request.requester,
            message=f'Your accepted task "{task.title}" has been marked completed by the hirer.',
            link='/my-requests'
        )

    return Response({"message": "Task marked as completed"}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)

    if task.status != 'completed':
        return Response({"error": "Task must be completed to leave a review"}, status=400)

    reviewer = request.user
    if reviewer == task.created_by:
        try:
            task_request = TaskRequest.objects.get(task=task, status='COMPLETED')
            reviewee = task_request.requester
        except TaskRequest.DoesNotExist:
            return Response({"error": "No completed helper found for this task"}, status=400)
    else:
        try:
            task_request = TaskRequest.objects.get(task=task, status='COMPLETED', requester=reviewer)
            reviewee = task.created_by
        except TaskRequest.DoesNotExist:
            return Response({"error": "You are not authorized to review this task"}, status=403)

    if Review.objects.filter(task=task, reviewer=reviewer).exists():
        return Response({"error": "You have already reviewed this task"}, status=400)

    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(task=task, reviewer=reviewer, reviewee=reviewee)
        notification_msg = f"{reviewer.username} left you a {serializer.validated_data['rating']} star review for task '{task.title}'."
        Notification.objects.create(user=reviewee, message=notification_msg, link='/dashboard')
        return Response(serializer.data, status=201)
    
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reviews(request, user_id):
    reviews = Review.objects.filter(reviewee_id=user_id).order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)