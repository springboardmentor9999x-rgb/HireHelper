from django.urls import path
from . import views

urlpatterns = [

    path("", views.get_notifications, name="notifications"),
    path("<int:pk>/", views.delete_notification, name="delete_notification"),

]