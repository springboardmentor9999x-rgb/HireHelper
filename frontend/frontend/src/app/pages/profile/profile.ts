import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AppUser } from '../../services/auth.service';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  user: AppUser | null = null;
  error = '';
  pwdError = '';
  pwdSuccess = '';
  loading = false;
  photoLoading = false;

  showPasswordForm = false;
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };
  selectedPhoto: File | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getStoredUser();

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.auth.saveUser(user);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
      }
    });
  }

  get userName(): string {
    if (!this.user) return 'User';
    return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || 'User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedPhoto = input.files[0];
      this.uploadPhoto();
    }
  }

  uploadPhoto(): void {
    if (!this.selectedPhoto) return;

    this.photoLoading = true;
    this.error = '';

    this.auth.updateProfilePicture(this.selectedPhoto).subscribe({
      next: (response) => {
        if (this.user) {
          this.user.profile_picture = response.profile_picture;
          this.auth.saveUser(this.user);
        }
        this.photoLoading = false;
        this.selectedPhoto = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Photo upload failed';
        this.photoLoading = false;
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (this.showPasswordForm) {
      this.pwdError = '';
      this.pwdSuccess = '';
      this.passwordForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
    }
  }

  onPasswordSubmit(): void {
    this.pwdError = '';
    this.pwdSuccess = '';
    this.loading = true;

    if (this.passwordForm.newPassword !== this.passwordForm.confirmNewPassword) {
      this.pwdError = 'New passwords do not match';
      this.loading = false;
      return;
    }

    this.auth.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.showPasswordForm = false;
        this.auth.logout();
        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'You have been logged out for security. Please login with your new password.',
          confirmButtonColor: '#10b981'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.pwdError = err.error?.message || 'Failed to change password';
        this.loading = false;
      }
    });

  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
