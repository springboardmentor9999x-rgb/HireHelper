from django.db import models
from django.conf import settings
from tasks.models import Task


class TaskRequest(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="requests"
    )

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_requests"
    )

    message = models.TextField(blank=True)
    hirer_reply = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "requests"
        constraints = [
            models.UniqueConstraint(
                fields=["task", "requester"],
                name="unique_task_request_per_requester"
            )
        ]

    def __str__(self):
        return f"{self.requester} → {self.task}"