from rest_framework import serializers
from .models import TaskRequest


class TaskRequestSerializer(serializers.ModelSerializer):
    task_id = serializers.IntegerField(source="task.id", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)
    task_location = serializers.CharField(source="task.location", read_only=True)
    requester_id = serializers.IntegerField(source="requester.id", read_only=True)
    requester_name = serializers.SerializerMethodField()
    requester_rating = serializers.FloatField(source="requester.average_rating", read_only=True)
    hirer_id = serializers.IntegerField(source="task.created_by.id", read_only=True)
    hirer_name = serializers.CharField(source="task.created_by.username", read_only=True)
    hirer_rating = serializers.FloatField(source="task.created_by.average_rating", read_only=True)

    class Meta:
        model = TaskRequest
        fields = [
            "id",
            "task_id",
            "task_title",
            "task_location",
            "requester_id",
            "requester_name",
            "requester_rating",
            "hirer_id",
            "hirer_name",
            "hirer_rating",
            "message",
            "hirer_reply",
            "status",
            "created_at",
            "updated_at"
        ]

    def get_requester_name(self, obj):
        return obj.requester.first_name or obj.requester.username