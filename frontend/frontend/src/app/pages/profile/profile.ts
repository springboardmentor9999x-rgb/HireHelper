import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
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
  private readonly apiOrigin = 'http://localhost:5000';
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      this.user = user
        ? {
            ...user,
            profile_picture: this.normalizeProfilePictureUrl(user.profile_picture)
          }
        : null;
      this.cdr.detectChanges();
    });

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        const normalizedUser = {
          ...user,
          profile_picture: this.normalizeProfilePictureUrl(user.profile_picture)
        };
        this.auth.saveUser(normalizedUser);
        this.cdr.detectChanges();
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

    this.auth.updateProfilePicture(this.selectedPhoto).pipe(
      timeout(30000),
      finalize(() => {
        this.photoLoading = false;
        this.selectedPhoto = null;
      })
    ).subscribe({
      next: (response) => {
        if (this.user) {
          const updatedUser = {
            ...this.user,
            profile_picture: this.normalizeProfilePictureUrl(response.profile_picture)
          };
          this.auth.saveUser(updatedUser);
          this.user = updatedUser;
        }

        this.cdr.detectChanges();

        Swal.fire({
          icon: 'success',
          title: 'Photo uploaded successfully',
          toast: true,
          position: 'top-end',
          timer: 2200,
          showConfirmButton: false,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#ffffff'
        });
      },
      error: (err) => {
        if (err?.name === 'TimeoutError') {
          this.error = 'Photo upload timed out. Please try again.';
          return;
        }
        this.error = err.error?.message || 'Photo upload failed';
      }
    });
  }

  private normalizeProfilePictureUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${this.apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
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
