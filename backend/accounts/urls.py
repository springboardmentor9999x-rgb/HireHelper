from django.urls import path
from . import views

urlpatterns = [

    path("register/", views.register_user, name="register"),

    path("login/", views.login_user, name="login"),

    path("verify-otp/", views.verify_otp, name="verify_otp"),

    path("resend-otp/", views.resend_otp, name="resend_otp"),

    path("forgot-password/", views.forgot_password, name="forgot_password"),

    path("reset-password/", views.reset_password, name="reset_password"),

    path("profile/", views.profile, name="profile"),

]