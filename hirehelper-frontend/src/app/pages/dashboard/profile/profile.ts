import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ReviewService, Review } from '../../../services/review.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
})
export class Profile implements OnInit {
    profileData = {
        first_name: '',
        last_name: '',
        phone_number: '',
        bio: '',
        professional_title: ''
    };

    reviews: Review[] = [];
    reviewsGiven: Review[] = [];
    loadingReviews = true;

    private toastService = inject(ToastService);
    private reviewService = inject(ReviewService);

    constructor(public authService: AuthService) { }

    ngOnInit() {
        const user = this.authService.currentUser();
        if (user) {
            this.profileData = {
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone_number: user.phone_number || '',
                bio: user.bio || '',
                professional_title: user.professional_title || ''
            };
            this.reviewService.getReviewsForUser(user.id).subscribe({
                next: (res) => {
                    this.reviews = res.reviews;
                    this.loadingReviews = false;
                },
                error: () => this.loadingReviews = false
            });
            this.reviewService.getReviewsGivenByUser(user.id).subscribe({
                next: (res) => this.reviewsGiven = res.reviews,
                error: () => {}
            });
        }
    }

    get averageRating(): number {
        if (!this.reviews.length) return 0;
        return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
    }

    updateProfile() {
        this.authService.updateProfile(this.profileData).subscribe({
            next: () => {
                this.toastService.showSuccess('Profile updated successfully! Information saved.');
            },
            error: () => {
                this.toastService.showError('Failed to update profile. Please try again.');
            }
        });
    }
}
