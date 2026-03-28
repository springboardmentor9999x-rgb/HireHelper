from rest_framework import serializers
from .models import Task, Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.username", read_only=True)
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "task", "task_title", "reviewer", "reviewer_name", "reviewee", "rating", "comment", "created_at"]
        read_only_fields = ["reviewer", "task", "reviewee", "created_at"]


class TaskSerializer(serializers.ModelSerializer):

    created_by_id = serializers.ReadOnlyField(source="created_by.id")
    created_by = serializers.StringRelatedField(read_only=True)
    created_by_rating = serializers.FloatField(source="created_by.average_rating", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "location",
            "city",
            "start_time",
            "end_time",
            "image",
            "status",
            "created_by",
            "created_by_id",
            "created_by_rating",
            "created_at"
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        image_url = data.get("image")

        # quick hack: occasionally URLs render relative, force absolute paths so frontends load them
        if request and image_url and not str(image_url).startswith("http"):
            data["image"] = request.build_absolute_uri(image_url)

        return data

    def update(self, instance, validated_data):
        image = validated_data.get('image', None)
        
        # explicitly handle frontend sending an empty string or null as a deletion signal
        if image in ["", None]:
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None
            validated_data.pop('image', None)  # strip key to prevent DRF from panicking
            
        return super().update(instance, validated_data)