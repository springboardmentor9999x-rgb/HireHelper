from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken  # ← Add this
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import get_connection, send_mail
from django.utils import timezone
import random
import logging

from .models import User
from .serializers import UserSerializer, RegisterSerializer, ProfileUpdateSerializer

logger = logging.getLogger(__name__)


def _normalize_email(value: str) -> str:
    return (value or "").strip().lower()


def _normalize_username(value: str) -> str:
    return (value or "").strip()


def _send_otp_email(subject: str, message: str, recipient_email: str):
    """Send OTP email with a fallback SMTP strategy for common TLS/SSL misconfigurations.

    Returns tuple: (sent: bool, error_message: str | None)
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        return True, None
    except Exception as primary_exc:
        if settings.EMAIL_BACKEND != 'django.core.mail.backends.smtp.EmailBackend':
            return False, str(primary_exc)

        # Retry once by switching between common SMTP modes:
        # 587/TLS <-> 465/SSL
        retry_port = 465 if settings.EMAIL_PORT == 587 else 587
        retry_use_ssl = retry_port == 465
        retry_use_tls = retry_port == 587

        try:
            retry_connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=settings.EMAIL_HOST,
                port=retry_port,
                username=settings.EMAIL_HOST_USER,
                password=settings.EMAIL_HOST_PASSWORD,
                use_tls=retry_use_tls,
                use_ssl=retry_use_ssl,
                fail_silently=False,
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                fail_silently=False,
                connection=retry_connection,
            )
            return True, None
        except Exception as retry_exc:
            logger.exception(
                "OTP email send failed. primary=%s retry=%s",
                primary_exc,
                retry_exc,
            )
            return False, str(retry_exc)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    # Step 1: Clean up incoming data to prevent case-sensitivity bugs when logging in later
    payload = request.data.copy()
    payload["email"] = _normalize_email(payload.get("email"))
    payload["username"] = _normalize_username(payload.get("username"))

    serializer = RegisterSerializer(data=payload)

    # Step 2: Validate the payload against our predefined serializer checks
    if serializer.is_valid():
        user = serializer.save()

        # Step 3: Generate a secure 6-digit OTP for email verification
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.otp_expiry = timezone.now() + timezone.timedelta(minutes=10) # Set strict 10 min expiry
        user.save()

        if settings.DEBUG:
            logger.warning("OTP for %s is %s", user.email, otp)
        
        # Step 4: Dispatch the OTP via email using our custom SMTP service
        sent, email_error = _send_otp_email(
            "HireHelper OTP Verification",
            f"Your OTP is {otp}",
            user.email,
        )

        if sent:
            return Response({"message": "User registered. OTP sent to email."})

        if settings.DEBUG:
            return Response(
                {
                    "message": "User registered, but email could not be sent. Use the OTP from backend logs.",
                    "otp": otp,
                    "email_error": email_error,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"error": "Registration created, but OTP email delivery failed. Please try resend OTP."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = (request.data.get("email") or "").strip().lower()
    otp = (request.data.get("otp") or "").strip()

    try:
        user = User.objects.get(email__iexact=email)

        if user.otp == otp and user.otp_expiry > timezone.now():
            user.is_verified = True
            user.save()
            return Response({"message": "OTP verified successfully"})

        return Response({"error": "Invalid or expired OTP"}, status=400)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    email = (request.data.get("email") or "").strip().lower()

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if user.is_verified:
        return Response({"error": "Account is already verified"}, status=400)

    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expiry = timezone.now() + timezone.timedelta(minutes=10)
    user.save()

    if settings.DEBUG:
        logger.warning("Resent OTP for %s is %s", user.email, otp)

    sent, email_error = _send_otp_email(
        "HireHelper OTP Verification",
        f"Your OTP is {otp}",
        user.email,
    )

    if sent:
        return Response({"message": "OTP resent successfully"})

    if settings.DEBUG:
        return Response(
            {
                "message": "Email delivery failed. Use the OTP from response.",
                "otp": otp,
                "email_error": email_error,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response({"error": "Failed to send OTP email"}, status=503)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = _normalize_email(request.data.get("email"))
    password = (request.data.get("password") or "")

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=400)

    candidates = list(User.objects.filter(email__iexact=email).order_by("-id"))

    # Legacy safety: handle rows where email was stored with accidental spaces/casing.
    if not candidates:
        normalized_matches = []
        for candidate in User.objects.all().only("id", "email"):
            if _normalize_email(candidate.email) == email:
                normalized_matches.append(candidate.id)
        if normalized_matches:
            candidates = list(User.objects.filter(id__in=normalized_matches).order_by("-id"))

    # Allow login using username in addition to email.
    if not candidates:
        username_key = _normalize_username(request.data.get("email"))
        if username_key:
            candidates = list(User.objects.filter(username__iexact=username_key).order_by("-id"))

    if not candidates:
        return Response({"error": "Invalid credentials"}, status=400)

    # Prefer Django auth backend path first (handles configured hashers/backends).
    for candidate in candidates:
        authenticated = authenticate(request, username=candidate.username, password=password)
        if authenticated:
            user = authenticated
            break
    else:
        user = None

    # Some legacy data may contain duplicate emails; pick the account with matching password.
    stripped_password = password.strip()
    if not user:
        user = next(
            (
                candidate for candidate in candidates
                if candidate.check_password(password) or (stripped_password and candidate.check_password(stripped_password))
            ),
            None,
        )

    # Legacy fallback: if a row somehow stored plain-text password, migrate it on successful match.
    if not user:
        for candidate in candidates:
            if candidate.password == password or (stripped_password and candidate.password == stripped_password):
                candidate.set_password(password)
                candidate.save(update_fields=["password"])
                user = candidate
                break

    if not user:
        return Response({"error": "Invalid credentials"}, status=400)

    if not user.is_verified:
        return Response({"error": "Account not verified"}, status=403)

    refresh = RefreshToken.for_user(user)
    profile_picture_url = request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else ""

    return Response({
        'token': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'name': user.first_name or user.username,
            'email': user.email,
            'role': user.role,
            'city': user.city,
            'profile_picture': profile_picture_url,
            'is_verified': user.is_verified
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = (request.data.get("email") or "").strip().lower()

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Do not reveal whether an email exists. Keep response generic.
        return Response(
            {
                "message": "If this email is registered, an OTP has been sent.",
            },
            status=status.HTTP_200_OK,
        )

    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expiry = timezone.now() + timezone.timedelta(minutes=10)
    user.save(update_fields=["otp", "otp_expiry"])

    if settings.DEBUG:
        logger.warning("Password reset OTP for %s is %s", user.email, otp)

    sent, email_error = _send_otp_email(
        "HireHelper Password Reset OTP",
        f"Your password reset OTP is {otp}",
        user.email,
    )

    if sent:
        return Response({"message": "Password reset OTP sent"})

    # Do not hard-fail password reset when email delivery has issues.
    # Return OTP fallback so user can proceed with reset flow.
    return Response(
        {
            "message": "Email delivery failed. Use OTP from response.",
            "otp": otp,
            "email_error": email_error,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = (request.data.get("email") or "").strip().lower()
    otp = (request.data.get("otp") or "").strip()
    new_password = request.data.get("new_password")

    if not email or not otp or not new_password:
        return Response({"error": "Email, OTP and new password are required"}, status=400)

    candidates = list(User.objects.filter(email__iexact=email).order_by("-id"))
    if not candidates:
        return Response({"error": "User not found"}, status=404)

    user = next(
        (
            candidate for candidate in candidates
            if candidate.otp == otp and candidate.otp_expiry and candidate.otp_expiry > timezone.now()
        ),
        None,
    )

    if not user:
        return Response({"error": "Invalid or expired OTP"}, status=400)

    user.set_password(new_password)
    user.otp = ""
    user.otp_expiry = None
    user.save(update_fields=["password", "otp", "otp_expiry"])

    return Response({"message": "Password reset successful"})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method in ['PUT', 'PATCH']:
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=request.method == 'PATCH'
        )

        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user, context={"request": request}).data)

        return Response(serializer.errors, status=400)

    serializer = UserSerializer(request.user, context={"request": request})
    return Response(serializer.data)