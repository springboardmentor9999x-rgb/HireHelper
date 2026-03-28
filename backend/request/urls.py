from django.urls import path
from . import views

urlpatterns = [
    path("", views.send_request, name="send_request"),
    path("my/", views.my_requests, name="my_requests"),
    path("<int:request_id>/", views.update_my_request, name="update_my_request"),
    path("received/", views.received_requests, name="received_requests"),
    path("reply/<int:request_id>/", views.reply_to_request, name="reply_to_request"),

    # Legacy aliases for compatibility with older frontend calls.
    path("myrequests/", views.my_requests, name="my_requests_legacy"),
    path("incoming/", views.received_requests, name="incoming_requests_legacy"),

    path("accept/<int:request_id>/", views.accept_request, name="accept_request"),
    path("reject/<int:request_id>/", views.reject_request, name="reject_request"),
]
