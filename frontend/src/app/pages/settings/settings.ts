import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  profile = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'helper',
    phone_number: '',
    bio: '',
    city: '',
    address: '',
    profile_picture: '',
  };

  selectedProfilePicture: File | null = null;
  profilePicturePreview = '';

  passwordData = {
    password: '',
    confirmPassword: '',
  };
  changePassword = false;

  loading = false;
  saveMessage = '';
  passwordMessage = '';
  errorMessage = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Show last known values immediately while profile API loads.
    this.profile.first_name = localStorage.getItem('userName') || '';
    this.profile.email = localStorage.getItem('userEmail') || '';
    this.profile.role = localStorage.getItem('userRole') || 'helper';
    this.profilePicturePreview = localStorage.getItem('userProfilePicture') || '';

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.authService.getProfile().subscribe(
      (res: any) => {
        this.profile = {
          ...this.profile,
          ...res,
        };

        this.profilePicturePreview = this.profile.profile_picture || '';
        localStorage.setItem('userProfilePicture', this.profile.profile_picture || '');
        this.loading = false;
      },
      () => {
        this.errorMessage = 'Failed to load latest profile. Showing saved local details.';
        this.loading = false;
      }
    );
  }

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;

    if (!file) {
      return;
    }

    this.selectedProfilePicture = file;
    this.profilePicturePreview = URL.createObjectURL(file);
  }

  saveProfile(): void {
    this.errorMessage = '';
    this.passwordMessage = '';

    if (this.changePassword) {
      if (!this.passwordData.password || !this.passwordData.confirmPassword) {
        this.passwordMessage = 'Fill both password fields to update password.';
        return;
      }

      if (this.passwordData.password !== this.passwordData.confirmPassword) {
        this.passwordMessage = 'Password and confirm password must match.';
        return;
      }
    }

    const formData = new FormData();

    formData.append('username', this.profile.username || '');
    formData.append('first_name', this.profile.first_name || '');
    formData.append('last_name', this.profile.last_name || '');
    formData.append('role', this.profile.role || 'helper');
    formData.append('phone_number', this.profile.phone_number || '');
    formData.append('bio', this.profile.bio || '');
    formData.append('city', this.profile.city || '');
    formData.append('address', this.profile.address || '');

    if (this.selectedProfilePicture) {
      formData.append('profile_picture', this.selectedProfilePicture);
    }

    if (this.changePassword && this.passwordData.password) {
      formData.append('password', this.passwordData.password);
      formData.append('confirm_password', this.passwordData.confirmPassword);
    }

    this.authService.updateProfile(formData).subscribe(
      (updated: any) => {
        localStorage.setItem('userName', updated?.first_name || updated?.username || 'User');
        localStorage.setItem('userRole', updated?.role || 'helper');
        localStorage.setItem('userEmail', updated?.email || '');
        localStorage.setItem('userProfilePicture', updated?.profile_picture || this.profilePicturePreview || '');

        this.profile = {
          ...this.profile,
          ...updated,
        };

        this.profilePicturePreview = this.profile.profile_picture || this.profilePicturePreview;

        this.passwordData.password = '';
        this.passwordData.confirmPassword = '';
        this.changePassword = false;
        this.selectedProfilePicture = null;

        this.saveMessage = 'Profile updated successfully.';
        setTimeout(() => {
          this.saveMessage = '';
        }, 2500);
      },
      (error) => {
        this.errorMessage =
          error?.error?.confirm_password?.[0] ||
          error?.error?.password?.[0] ||
          error?.error?.detail ||
          'Failed to update profile.';
      }
    );
  }

  onToggleChangePassword(): void {
    if (!this.changePassword) {
      this.passwordData.password = '';
      this.passwordData.confirmPassword = '';
      this.passwordMessage = '';
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getRoleLabel(): string {
    return this.profile.role?.toLowerCase() === 'hirer'
      ? 'Hirer'
      : 'Helper';
  }
}
