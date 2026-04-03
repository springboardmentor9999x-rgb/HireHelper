import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { AuthService, AppUser, UpdateProfilePayload } from '../../services/auth.service';
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
  editLoading = false;
  showEditForm = false;

  showPasswordForm = false;
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  profileForm = {
    first_name: '',
    last_name: '',
    email_id: '',
    phone_number: '',
    profession: '',
    interests: '',
    experience_years: null as number | null,
    skills: '',
    bio: '',
    city: '',
    availability: ''
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
      this.syncProfileForm();
      this.cdr.detectChanges();
    });

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        const normalizedUser = {
          ...user,
          profile_picture: this.normalizeProfilePictureUrl(user.profile_picture)
        };
        this.auth.saveUser(normalizedUser);
        this.syncProfileForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
      }
    });
  }

  get userName(): string {
    if (!this.user) {
      return 'User';
    }
    return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || 'User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  displayValue(value?: string | number | null): string {
    if (value === null || value === undefined) {
      return 'Not provided';
    }

    if (typeof value === 'number') {
      return `${value}`;
    }

    const trimmed = value.trim();
    return trimmed || 'Not provided';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedPhoto = input.files[0];
      this.uploadPhoto();
    }
  }

  uploadPhoto(): void {
    if (!this.selectedPhoto) {
      return;
    }

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

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    this.error = '';
    if (this.showEditForm) {
      this.syncProfileForm();
      return;
    }
    this.showPasswordForm = false;
    this.pwdError = '';
    this.pwdSuccess = '';
  }

  onEditSubmit(): void {
    if (!this.user) {
      return;
    }

    this.error = '';
    this.editLoading = true;

    const payload: UpdateProfilePayload = {
      first_name: this.profileForm.first_name.trim(),
      last_name: this.profileForm.last_name.trim(),
      phone_number: this.profileForm.phone_number.trim(),
      profession: this.profileForm.profession.trim(),
      interests: this.profileForm.interests.trim(),
      experience_years: this.profileForm.experience_years,
      skills: this.profileForm.skills.trim(),
      bio: this.profileForm.bio.trim(),
      city: this.profileForm.city.trim(),
      availability: this.profileForm.availability.trim()
    };

    this.auth.updateCurrentUser(payload).pipe(
      finalize(() => {
        this.editLoading = false;
      })
    ).subscribe({
      next: (updatedUser) => {
        const normalizedUser = {
          ...updatedUser,
          profile_picture: this.normalizeProfilePictureUrl(updatedUser.profile_picture)
        };
        this.auth.saveUser(normalizedUser);
        this.user = normalizedUser;
        this.showEditForm = false;
        this.syncProfileForm();
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'success',
          title: 'Profile updated',
          toast: true,
          position: 'top-end',
          timer: 2200,
          showConfirmButton: false,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#ffffff'
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
      }
    });
  }

  private syncProfileForm(): void {
    if (!this.user) {
      return;
    }

    this.profileForm = {
      first_name: this.user.first_name || '',
      last_name: this.user.last_name || '',
      email_id: this.user.email_id || '',
      phone_number: this.user.phone_number || '',
      profession: this.user.profession || '',
      interests: this.user.interests || '',
      experience_years: this.user.experience_years ?? null,
      skills: this.user.skills || '',
      bio: this.user.bio || '',
      city: this.user.city || '',
      availability: this.user.availability || ''
    };
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
      next: () => {
        this.loading = false;
        this.showPasswordForm = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'Password changed successfully. You can continue editing your profile.',
          confirmButtonColor: '#10b981'
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
