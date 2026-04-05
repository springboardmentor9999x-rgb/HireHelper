import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
        professional_title: '',
        picture_url: ''
    };

    isUploading = signal(false);

    reviews = signal<Review[]>([]);
    reviewsGiven = signal<Review[]>([]);
    loadingReviews = signal<boolean>(true);

    averageRating = computed(() => {
        const revs = this.reviews();
        if (!revs.length) return 0;
        return revs.reduce((sum, r) => sum + r.rating, 0) / revs.length;
    });

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
                professional_title: user.professional_title || '',
                picture_url: user.picture_url || ''
            };
            this.reviewService.getReviewsForUser(user.id).subscribe({
                next: (res) => {
                    this.reviews.set(res.reviews || []);
                    this.loadingReviews.set(false);
                },
                error: (err) => {
                    console.error('Error fetching received reviews:', err);
                    this.loadingReviews.set(false);
                    this.toastService.showError('Could not load reviews received.');
                }
            });
            this.reviewService.getReviewsGivenByUser(user.id).subscribe({
                next: (res) => this.reviewsGiven.set(res.reviews || []),
                error: (err) => {
                    console.error('Error fetching given reviews:', err);
                    this.toastService.showError('Could not load reviews given.');
                }
            });
        }
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

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isUploading.set(true);
            this.authService.uploadProfilePicture(file).subscribe({
                next: (res) => {
                    this.isUploading.set(true);
                    this.profileData.picture_url = res.picture_url;
                    this.toastService.showSuccess('Profile picture updated successfully.');
                    this.isUploading.set(false);
                },
                error: () => {
                    this.isUploading.set(false);
                    this.toastService.showError('Failed to upload picture.');
                }
            });
        }
    }
}
