import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

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

    private toastService = inject(ToastService);

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
        }
    }

    updateProfile() {
        this.authService.updateProfile(this.profileData).subscribe({
            next: (res) => {
                this.toastService.showSuccess('Profile updated successfully! Information saved.');
            },
            error: (err) => {
                this.toastService.showError('Failed to update profile. Please try again.');
            }
        });
    }
}
