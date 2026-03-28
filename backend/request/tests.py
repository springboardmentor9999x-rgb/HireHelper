from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from notifications.models import Notification
from tasks.models import Task
from .models import TaskRequest


class RequestApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			username="owner",
			email="owner@example.com",
			password="Pass@1234",
			role="employer",
			is_verified=True,
		)
		self.helper = User.objects.create_user(
			username="helper",
			email="helper@example.com",
			password="Pass@1234",
			role="helper",
			is_verified=True,
		)
		self.other_helper = User.objects.create_user(
			username="otherhelper",
			email="otherhelper@example.com",
			password="Pass@1234",
			role="helper",
			is_verified=True,
		)

		self.task = Task.objects.create(
			title="Fix kitchen sink",
			description="Need urgent plumbing help",
			location="Downtown",
			city="Delhi",
			start_time=timezone.now(),
			created_by=self.owner,
			status="open",
		)

	def test_send_request_success(self):
		self.client.force_authenticate(user=self.helper)

		response = self.client.post(
			reverse("send_request"),
			{"task_id": self.task.id, "message": "I can do this quickly."},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data["message"], "Request sent successfully")
		created_request = TaskRequest.objects.filter(task=self.task, requester=self.helper).first()
		self.assertIsNotNone(created_request)
		self.assertEqual(created_request.message, "I can do this quickly.")
		notification = Notification.objects.filter(user=self.owner).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("requested to help", notification.message)
		self.assertIn("Message: I can do this quickly.", notification.message)

	def test_send_request_rejects_duplicate(self):
		TaskRequest.objects.create(task=self.task, requester=self.helper)
		self.client.force_authenticate(user=self.helper)

		response = self.client.post(
			reverse("send_request"),
			{"task_id": self.task.id},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data["error"], "You already requested this task")

	def test_send_request_rejects_own_task(self):
		self.client.force_authenticate(user=self.owner)

		response = self.client.post(
			reverse("send_request"),
			{"task_id": self.task.id},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_send_request_rejects_non_open_task(self):
		self.task.status = "completed"
		self.task.save(update_fields=["status"])
		self.client.force_authenticate(user=self.helper)

		response = self.client.post(
			reverse("send_request"),
			{"task_id": self.task.id},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data["error"], "Task is not open")

	def test_my_requests_returns_requested_tasks(self):
		TaskRequest.objects.create(task=self.task, requester=self.helper)
		self.client.force_authenticate(user=self.helper)

		response = self.client.get(reverse("my_requests"))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["task_title"], self.task.title)
		self.assertEqual(response.data[0]["task_location"], self.task.location)

	def test_received_requests_returns_requests_for_owner_tasks(self):
		TaskRequest.objects.create(task=self.task, requester=self.helper)
		TaskRequest.objects.create(task=self.task, requester=self.other_helper)
		self.client.force_authenticate(user=self.owner)

		response = self.client.get(reverse("received_requests"))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)

	def test_update_my_pending_request_message(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			message="Initial message",
		)
		self.client.force_authenticate(user=self.helper)

		response = self.client.patch(
			reverse("update_my_request", kwargs={"request_id": request_obj.id}),
			{"message": "Updated message for hirer"},
			format="json",
		)

		request_obj.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(request_obj.message, "Updated message for hirer")
		notification = Notification.objects.filter(user=self.owner).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("updated their request message", notification.message)
		self.assertIn("Message: Updated message for hirer", notification.message)

	def test_accept_request_notifies_helper(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="PENDING",
		)
		self.client.force_authenticate(user=self.owner)

		response = self.client.post(
			reverse("accept_request", kwargs={"request_id": request_obj.id}),
			{},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		notification = Notification.objects.filter(user=self.helper).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("has been accepted", notification.message)

	def test_reject_request_notifies_helper(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="PENDING",
		)
		self.client.force_authenticate(user=self.owner)

		response = self.client.post(
			reverse("reject_request", kwargs={"request_id": request_obj.id}),
			{},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		notification = Notification.objects.filter(user=self.helper).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("was not accepted", notification.message)

	def test_hirer_can_reply_to_helper_request(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="PENDING",
		)
		self.client.force_authenticate(user=self.owner)

		response = self.client.patch(
			reverse("reply_to_request", kwargs={"request_id": request_obj.id}),
			{"hirer_reply": "Thanks, I will review and update soon."},
			format="json",
		)

		request_obj.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(request_obj.hirer_reply, "Thanks, I will review and update soon.")
		notification = Notification.objects.filter(user=self.helper).order_by("-created_at").first()
		self.assertIsNotNone(notification)
		self.assertIn("replied to your request", notification.message)
		self.assertIn("Reply: Thanks, I will review and update soon.", notification.message)

	def test_non_owner_cannot_reply_to_request(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="PENDING",
		)
		self.client.force_authenticate(user=self.other_helper)

		response = self.client.patch(
			reverse("reply_to_request", kwargs={"request_id": request_obj.id}),
			{"hirer_reply": "Invalid reply"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_update_my_request_rejects_non_pending(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="ACCEPTED",
			message="Initial",
		)
		self.client.force_authenticate(user=self.helper)

		response = self.client.patch(
			reverse("update_my_request", kwargs={"request_id": request_obj.id}),
			{"message": "Try update"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data["error"], "Only pending requests can be edited")

	def test_delete_my_pending_request(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="PENDING",
		)
		self.client.force_authenticate(user=self.helper)

		response = self.client.delete(
			reverse("update_my_request", kwargs={"request_id": request_obj.id}),
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(TaskRequest.objects.filter(id=request_obj.id).exists())

	def test_delete_my_request_rejects_non_pending(self):
		request_obj = TaskRequest.objects.create(
			task=self.task,
			requester=self.helper,
			status="ACCEPTED",
		)
		self.client.force_authenticate(user=self.helper)

		response = self.client.delete(
			reverse("update_my_request", kwargs={"request_id": request_obj.id}),
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data["error"], "Only pending requests can be deleted")
