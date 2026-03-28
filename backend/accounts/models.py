from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = [
        ('helper', 'Helper'),
        ('hirer', 'Hirer'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    phone_number = models.CharField(max_length=15, blank=True)

    profile_picture = models.ImageField(
        upload_to="profiles/",
        null=True,
        blank=True
    )

    bio = models.TextField(blank=True)

    city = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)

    otp = models.CharField(max_length=6, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def average_rating(self):
        reviews = self.reviews_received.all()
        if not reviews:
            return 0.0
        return round(sum(r.rating for r in reviews) / len(reviews), 1)

    def __str__(self):
        return self.username