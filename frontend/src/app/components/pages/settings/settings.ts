import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageService } from '../../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';

interface Settings {
  profile: any;
  privacy: any;
  language: any;
  appearance: any;
  notifications: any;
  security: any;
}

interface Toast {
  type: 'success' | 'error' | 'warning';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule]
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: Settings | null = null;
  loading = false;
  activeTab = 'profile';
  private destroy$ = new Subject<void>();

  // Forms
  profileForm: FormGroup;
  privacyForm: FormGroup;
  languageForm: FormGroup;
  appearanceForm: FormGroup;
  notificationsForm: FormGroup;
  passwordForm: FormGroup;
  deleteAccountForm: FormGroup;

  // UI State
  toast: Toast = { type: 'success', message: '', visible: false };
  showPasswordModal = false;
  showDeleteModal = false;
  savingProfile = false;
  savingPassword = false;
  deletingAccount = false;

  // Languages
  languages = ['English', 'Telugu', 'Hindi'];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private languageService: LanguageService
  ) {
    // Initialize forms
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', Validators.maxLength(500)],
      profile_picture: ['']
    });

    this.privacyForm = this.fb.group({
      show_profile_in_feed: [true],
      allow_messages: [true],
      email_notifications: [true]
    });

    this.languageForm = this.fb.group({
      language: ['English']
    });

    this.appearanceForm = this.fb.group({
      dark_mode: [false]
    });

    this.notificationsForm = this.fb.group({
      task_requests: [true],
      task_updates: [true],
      announcements: [true]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator() });

    this.deleteAccountForm = this.fb.group({
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadSettings();
    this.loadSavedLanguage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load saved language from localStorage and apply it
   */
  loadSavedLanguage(): void {
    const currentLanguage = this.languageService.getCurrentLanguage();
    this.languageForm.patchValue({ language: currentLanguage }, { emitEvent: false });
  }

  /**
   * Load user profile from /api/users/me
   */
  loadProfile(): void {
    const apiUrl = `${environment.apiUrl}/users/me`;
    console.log('📥 [Settings] Loading profile from:', apiUrl);

    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ [Settings] Profile loaded successfully:', response.data);
          if (response.success && response.data) {
            this.profileForm.patchValue({
              first_name: response.data.first_name || '',
              last_name: response.data.last_name || '',
              bio: response.data.bio || '',
              profile_picture: response.data.profile_picture || ''
            });
          }
        },
        error: (error) => {
          console.error('❌ [Settings] Error loading profile:', error);
          this.showToast('error', 'Failed to load profile');
        }
      });
  }

  /**
   * Load all settings
   */
  loadSettings(): void {
    this.loading = true;
    const apiUrl = `${environment.apiUrl}/settings`;

    this.http.get<any>(apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.settings = response.data;
            this.populateForms();
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error loading settings:', error);
          this.showToast('error', 'Failed to load settings');
        }
      });
  }

  /**
   * Populate all forms with current settings
   */
  populateForms(): void {
    if (!this.settings) return;

    // Profile form
    this.profileForm.patchValue(this.settings.profile);

    // Privacy form
    this.privacyForm.patchValue(this.settings.privacy);

    // Language form
    this.languageForm.patchValue({
      language: this.settings.language.current
    });

    // Appearance form
    this.appearanceForm.patchValue({
      dark_mode: this.settings.appearance.dark_mode
    });

    // Notifications form
    this.notificationsForm.patchValue(this.settings.notifications);
  }

  /**
   * SECTION 1: Update Profile Settings via /api/users/me
   */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      console.log('❌ [Settings] Profile form is invalid');
      this.showToast('error', 'Please fill all required fields correctly');
      return;
    }

    this.savingProfile = true;
    const apiUrl = `${environment.apiUrl}/users/me`;
    const payload = {
      first_name: this.profileForm.value.first_name || '',
      last_name: this.profileForm.value.last_name || '',
      bio: this.profileForm.value.bio || '',
      profile_picture: this.profileForm.value.profile_picture || ''
    };

    console.log('📤 [Settings] Updating profile to:', apiUrl, payload);

    this.http.put<any>(apiUrl, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.savingProfile = false;
          console.log('✅ [Settings] Profile updated successfully:', response);
          if (response.success && response.data) {
            // Update form with returned data
            this.profileForm.patchValue({
              first_name: response.data.first_name || '',
              last_name: response.data.last_name || '',
              bio: response.data.bio || '',
              profile_picture: response.data.profile_picture || ''
            }, { emitEvent: false });
            
            // Update settings object for consistency
            if (this.settings && this.settings.profile) {
              this.settings.profile = {
                ...this.settings.profile,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                bio: response.data.bio,
                profile_picture: response.data.profile_picture
              };
            }
            
            this.showToast('success', 'Profile updated successfully ✓');
          }
        },
        error: (error) => {
          this.savingProfile = false;
          console.error('❌ [Settings] Error updating profile:', error);
          const message = error.error?.message || 'Failed to update profile';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 2: Update Privacy Settings
   */
  savePrivacy(): void {
    const apiUrl = `${environment.apiUrl}/settings/privacy`;
    const payload = this.privacyForm.value;

    console.log('📤 [Settings] Saving privacy settings:', payload);

    this.http.put<any>(apiUrl, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ [Settings] Privacy settings saved:', response);
          if (response.success) {
            // Update settings object
            if (this.settings && response.data && response.data.privacy) {
              this.settings.privacy = response.data.privacy;
              this.privacyForm.patchValue(response.data.privacy, { emitEvent: false });
            }
            this.showToast('success', 'Privacy settings saved ✓');
          }
        },
        error: (error) => {
          console.error('❌ [Settings] Error saving privacy:', error);
          const message = error.error?.message || 'Failed to save privacy settings';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 3: Update Language
   */
  saveLanguage(): void {
    const apiUrl = `${environment.apiUrl}/settings/language`;
    const language = this.languageForm.value.language;

    console.log('📤 [Settings] Saving language preference:', language);

    this.http.put<any>(apiUrl, { language })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ [Settings] Language preference saved:', response);
          if (response.success) {
            // Update form with returned data
            this.languageForm.patchValue({
              language: response.data.language || language
            }, { emitEvent: false });

            // Use LanguageService to set language globally
            this.languageService.setLanguage(response.data.language || language);

            // Update settings object
            if (this.settings) {
              this.settings.language = { current: response.data.language || language };
            }
            this.showToast('success', `Language changed to ${language} ✓`);
          }
        },
        error: (error) => {
          console.error('❌ [Settings] Error changing language:', error);
          const message = error.error?.message || 'Failed to change language';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 4: Update Appearance (Dark Mode)
   */
  saveDarkMode(): void {
    const darkMode = this.appearanceForm.value.dark_mode;
    const apiUrl = `${environment.apiUrl}/settings/appearance`;

    console.log('📤 [Settings] Saving appearance settings - Dark Mode:', darkMode);

    this.http.put<any>(apiUrl, { dark_mode: darkMode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ [Settings] Appearance settings saved:', response);
          if (response.success) {
            this.applyDarkMode(darkMode);
            // Update settings object
            if (this.settings) {
              this.settings.appearance = { dark_mode: darkMode };
            }
            const theme = darkMode ? 'Dark Mode' : 'Light Mode';
            this.showToast('success', `${theme} enabled ✓`);
          }
        },
        error: (error) => {
          console.error('❌ [Settings] Error updating appearance:', error);
          const message = error.error?.message || 'Failed to update appearance';
          this.showToast('error', message);
          // Revert the toggle on error
          this.appearanceForm.patchValue({ dark_mode: !darkMode }, { emitEvent: false });
        }
      });
  }

  /**
   * Apply dark mode to DOM
   */
  applyDarkMode(enabled: boolean): void {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }

  /**
   * SECTION 5: Update Notifications
   */
  saveNotifications(): void {
    const apiUrl = `${environment.apiUrl}/settings/notifications`;
    const payload = this.notificationsForm.value;

    console.log('📤 [Settings] Saving notification preferences:', payload);

    this.http.put<any>(apiUrl, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ [Settings] Notifications saved:', response);
          if (response.success) {
            // Update settings object with response data
            if (this.settings) {
              if (response.data && response.data.notifications) {
                this.settings.notifications = response.data.notifications;
                this.notificationsForm.patchValue(response.data.notifications, { emitEvent: false });
              } else if (response.data && response.data.data && response.data.data.notifications) {
                this.settings.notifications = response.data.data.notifications;
                this.notificationsForm.patchValue(response.data.data.notifications, { emitEvent: false });
              }
            }
            this.showToast('success', 'Notification preferences updated ✓');
          }
        },
        error: (error) => {
          console.error('❌ [Settings] Error updating notifications:', error);
          const message = error.error?.message || 'Failed to update notifications';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 6: Change Password
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.showToast('error', 'Please fill all password fields correctly');
      return;
    }

    this.savingPassword = true;
    const apiUrl = `${environment.apiUrl}/settings/password`;

    this.http.put<any>(apiUrl, this.passwordForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.savingPassword = false;
          if (response.success) {
            this.showToast('success', 'Password changed successfully ✓');
            this.passwordForm.reset();
            this.showPasswordModal = false;
          }
        },
        error: (error) => {
          this.savingPassword = false;
          const message = error.error?.message || 'Failed to change password';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 7: Delete Account
   */
  deleteAccountConfirm(): void {
    if (this.deleteAccountForm.invalid) {
      this.showToast('error', 'Password is required');
      return;
    }

    this.deletingAccount = true;
    const apiUrl = `${environment.apiUrl}/settings/delete-account`;

    this.http.delete<any>(apiUrl, {
      body: this.deleteAccountForm.value
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.deletingAccount = false;
          if (response.success) {
            this.showToast('success', 'Account deleted. Redirecting to login...');
            setTimeout(() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userId');
              this.router.navigate(['/login']);
            }, 2000);
          }
        },
        error: (error) => {
          this.deletingAccount = false;
          const message = error.error?.message || 'Failed to delete account';
          this.showToast('error', message);
        }
      });
  }

  /**
   * SECTION 8: File Upload for Profile Picture
   */
  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileForm.patchValue({
          profile_picture: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Clear profile picture
   */
  clearProfilePicture(): void {
    this.profileForm.patchValue({
      profile_picture: null
    });
  }

  /**
   * Show toast notification
   */
  showToast(type: 'success' | 'error' | 'warning', message: string): void {
    this.toast = { type, message, visible: true };
    setTimeout(() => {
      this.toast.visible = false;
    }, 3000);
  }

  /**
   * Custom validators
   */
  passwordMatchValidator() {
    return (group: FormGroup) => {
      const password = group.get('new_password')?.value;
      const confirm = group.get('confirm_password')?.value;
      return password === confirm ? null : { passwordMismatch: true };
    };
  }

  /**
   * Form validation helpers
   */
  hasError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['invalidPhone']) return 'Phone number must be at least 10 digits';
    if (field.errors['pattern']) return `${fieldName} format is invalid`;

    return 'Invalid field';
  }
}

