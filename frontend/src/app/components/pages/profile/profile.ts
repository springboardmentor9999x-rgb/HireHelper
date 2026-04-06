import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService, UserProfile } from '../../../services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  profileForm: FormGroup;
  loading = false;
  editing = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private profileService: ProfileService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      phone_number: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  /**
   * Load user profile from API
   */
  loadProfile() {
    this.loading = true;
    this.errorMessage = '';

    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.profile = response.data;
          this.profileForm.patchValue({
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            phone_number: response.data.phone_number,
          });
        } else {
          this.errorMessage = 'Failed to load profile';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading profile:', error);
        this.errorMessage = error.error?.message || 'Failed to load profile';
      },
    });
  }

  /**
   * Toggle edit mode
   */
  toggleEdit() {
    if (this.editing) {
      this.profileForm.reset({
        first_name: this.profile?.first_name,
        last_name: this.profile?.last_name,
        phone_number: this.profile?.phone_number,
      });
    }
    this.editing = !this.editing;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Save profile changes
   */
  saveProfile() {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
      first_name: this.profileForm.get('first_name')?.value,
      last_name: this.profileForm.get('last_name')?.value,
      phone_number: this.profileForm.get('phone_number')?.value,
    };

    this.profileService.updateProfile(formData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.profile = response.data;
          this.successMessage = 'Profile updated successfully';
          this.editing = false;
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to update profile';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating profile:', error);
        this.errorMessage = error.error?.message || 'Failed to update profile';
      },
    });
  }

  /**
   * Check if form field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get form controls
   */
  get f() {
    return this.profileForm.controls;
  }
}
