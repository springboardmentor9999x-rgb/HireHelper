from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from notifications.models import Notification
from request.models import TaskRequest
from tasks.models import Task


class TaskCompletionApiTests(APITestCase):
	def setUp(self):
		self.hirer = User.objects.create_user(
			username="hirer_user",
			email="hirer@example.com",
			password="Pass@1234",
			role="hirer",
			is_verified=True,
		)
		self.helper = User.objects.create_user(
			username="helper_user",
			email="helper@example.com",
			password="Pass@1234",
			role="helper",
			is_verified=True,
		)

		self.task = Task.objects.create(
			title="Garden cleaning",
			description="Need help in cleaning backyard",
			location="Sector 12",
			city="Jaipur",
			start_time=timezone.now(),
			created_by=self.hirer,
			status="in_progress",
		)

		self.request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="ACCEPTED",
		)

	def test_hirer_can_mark_task_completed(self):
		self.client.force_authenticate(user=self.hirer)

		response = self.client.post(
			reverse("complete_task", kwargs={"task_id": self.task.id}),
			{},
			format="json",
		)

		self.task.refresh_from_db()
		self.request_obj.refresh_from_db()

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.task.status, "completed")
		self.assertEqual(self.request_obj.status, "COMPLETED")

		notification = Notification.objects.filter(user=self.helper).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("marked completed", notification.message)

	def test_cannot_complete_task_that_is_not_in_progress(self):
		self.task.status = "open"
		self.task.save(update_fields=["status"])
		self.client.force_authenticate(user=self.hirer)

		response = self.client.post(
			reverse("complete_task", kwargs={"task_id": self.task.id}),
			{},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data["error"], "Only in-progress tasks can be marked completed")

	def test_non_owner_cannot_complete_task(self):
		self.client.force_authenticate(user=self.helper)

		response = self.client.post(
			reverse("complete_task", kwargs={"task_id": self.task.id}),
			{},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
