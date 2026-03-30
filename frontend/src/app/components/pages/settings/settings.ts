import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService, UserSettings } from '../../../services/settings.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class SettingsComponent implements OnInit {
  // Settings data
  settings: UserSettings | null = null;
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  // UI State
  activeSection = 'profile';
  showPasswordModal = false;
  showDeleteModal = false;

  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  deleteForm: FormGroup;

  // Profile completion
  profileCompletion = 0;

  // Available options
  languages = ['English', 'Spanish', 'Hindi'];

  constructor(
    private settingsService: SettingsService,
    private profileService: ProfileService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      phone_number: [''],
    });

    this.passwordForm = this.fb.group(
      {
        current_password: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    this.deleteForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  /**
   * Load user settings
   */
  loadSettings() {
    this.loading = true;
    this.errorMessage = '';

    this.settingsService.getSettings().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.settings = response.data;
          this.populateProfileForm();
          this.calculateProfileCompletion();
        } else {
          this.errorMessage = response.message || 'Failed to load settings';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading settings:', error);
        this.errorMessage = error.error?.message || 'Failed to load settings';
      },
    });
  }

  /**
   * Populate profile form with current data
   */
  populateProfileForm() {
    if (this.settings) {
      this.profileForm.patchValue({
        first_name: this.settings.firstName,
        last_name: this.settings.lastName,
        phone_number: this.settings.phoneNumber || '',
      });
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion() {
    if (!this.settings) return;

    let completed = 0;
    const total = 6; // 6 criteria

    if (this.settings.firstName) completed++;
    if (this.settings.lastName) completed++;
    if (this.settings.phoneNumber) completed++;
    if (this.settings.profilePicture) completed++;
    if (this.settings.email) completed++;
    if (this.settings.lastLogin) completed++;

    this.profileCompletion = Math.round((completed / total) * 100);
  }

  /**
   * Update profile information
   */
  updateProfile() {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.profileForm.value;
    this.profileService.updateProfile({
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      phone_number: formValue.phone_number
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.showSuccessMessage('Profile updated successfully');
        } else {
          this.errorMessage = response.message || 'Failed to update profile';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update profile';
      }
    });
  }

  /**
   * Toggle notification email
   */
  toggleEmailNotifications() {
    if (!this.settings) return;

    this.saving = true;
    this.settingsService.updateNotifications({
      notification_email: !this.settings.notifications.email,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && this.settings) {
          this.settings.notifications.email = !this.settings.notifications.email;
          this.showSuccessMessage('Email notifications updated');
        } else {
          this.errorMessage = response.message || 'Failed to update notifications';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update notifications';
      },
    });
  }

  /**
   * Toggle notification push
   */
  togglePushNotifications() {
    if (!this.settings) return;

    this.saving = true;
    this.settingsService.updateNotifications({
      notification_push: !this.settings.notifications.push,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && this.settings) {
          this.settings.notifications.push = !this.settings.notifications.push;
          this.showSuccessMessage('Push notifications updated');
        } else {
          this.errorMessage = response.message || 'Failed to update notifications';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update notifications';
      },
    });
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    if (!this.settings) return;

    this.saving = true;
    this.settingsService.updateTheme({
      dark_mode: !this.settings.theme.darkMode,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && this.settings) {
          this.settings.theme.darkMode = !this.settings.theme.darkMode;
          this.applyDarkMode(this.settings.theme.darkMode);
          this.showSuccessMessage('Dark mode updated');
        } else {
          this.errorMessage = response.message || 'Failed to update theme';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update theme';
      },
    });
  }

  /**
   * Apply dark mode CSS class
   */
  applyDarkMode(enabled: boolean) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }

  /**
   * Toggle profile visibility
   */
  toggleProfileVisibility() {
    if (!this.settings) return;

    this.saving = true;
    this.settingsService.updatePrivacy({
      profile_visibility: !this.settings.privacy.profileVisibility,
    }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && this.settings) {
          this.settings.privacy.profileVisibility = !this.settings.privacy.profileVisibility;
          this.showSuccessMessage('Privacy settings updated');
        } else {
          this.errorMessage = response.message || 'Failed to update privacy';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update privacy';
      },
    });
  }

  /**
   * Update language
   */
  updateLanguage(language: string) {
    if (!this.settings || this.settings.language === language) return;

    this.saving = true;
    this.settingsService.updateLanguage({ language }).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && this.settings) {
          this.settings.language = language;
          this.showSuccessMessage(`Language changed to ${language}`);
        } else {
          this.errorMessage = response.message || 'Failed to update language';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to update language';
      },
    });
  }

  /**
   * Change password
   */
  changePassword() {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please fill all password fields correctly';
      return;
    }

    const formValue = this.passwordForm.value;
    this.saving = true;
    this.errorMessage = '';

    console.log('📝 Sending password change request:', {
      current_password: '***',
      new_password: '***',
      confirm_password: '***'
    });

    this.profileService.changePassword({
      current_password: formValue.current_password,
      new_password: formValue.new_password,
      confirm_password: formValue.confirm_password
    }).subscribe({
      next: (response) => {
        this.saving = false;
        console.log('✅ Password change response:', response);
        if (response.success) {
          this.showSuccessMessage('Password changed successfully');
          this.passwordForm.reset();
          this.showPasswordModal = false;
        } else {
          this.errorMessage = response.message || 'Failed to change password';
        }
      },
      error: (error) => {
        this.saving = false;
        console.error('❌ Password change error:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to change password';
        this.errorMessage = errorMsg;
      },
    });
  }

  /**
   * Delete account
   */
  deleteAccount() {
    if (this.deleteForm.invalid) {
      this.errorMessage = 'Please enter your password';
      return;
    }

    const password = this.deleteForm.get('password')?.value;
    this.saving = true;
    this.errorMessage = '';

    this.profileService.deleteAccount(password).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          // Clear auth and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = response.message || 'Failed to delete account';
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Failed to delete account';
      },
    });
  }

  /**
   * Custom validator for password matching
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('new_password')?.value;
    const confirm = group.get('confirm_password')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  /**
   * Show success message and auto dismiss
   */
  showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get form controls
   */
  get pf() {
    return this.profileForm.controls;
  }

  get pwf() {
    return this.passwordForm.controls;
  }

  get df() {
    return this.deleteForm.controls;
  }
}
