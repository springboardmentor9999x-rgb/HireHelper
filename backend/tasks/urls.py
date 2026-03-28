from django.urls import path
from . import views

urlpatterns = [

    path("create/", views.create_task, name="create_task"),

    path("feed/", views.task_feed, name="task_feed"),

    path("mytasks/", views.my_tasks, name="my_tasks"),

    path("update/<int:task_id>/", views.update_task, name="update_task"),

    path("complete/<int:task_id>/", views.complete_task, name="complete_task"),

    path("delete/<int:task_id>/", views.delete_task, name="delete_task"),

    path("review/<int:task_id>/", views.submit_review, name="submit_review"),

    path("user-reviews/<int:user_id>/", views.user_reviews, name="user_reviews"),

]