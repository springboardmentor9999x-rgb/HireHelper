import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  passwordForm!: FormGroup;

  successMsg = '';
  errorMsg = '';
  passwordSuccessMsg = '';
  passwordErrorMsg = '';
  submitted = false;
  passwordSubmitted = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      profile_picture: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.loadProfile();
  }

  goBack(): void {
    window.history.back();
  }

  loadProfile() {
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'User not logged in';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:5000/api/users/me', { headers }).subscribe({
      next: (res) => {
        this.settingsForm.patchValue({
          first_name: res.first_name || '',
          last_name: res.last_name || '',
          number: res.number || '',
          profile_picture: res.profile_picture || ''
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err.error?.message || 'Failed to load profile';
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    this.successMsg = '';
    this.errorMsg = '';

    if (this.settingsForm.invalid) {
      this.errorMsg = 'Please fill all required fields correctly';
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMsg = 'User not logged in';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.put<any>('http://localhost:5000/api/users/me', this.settingsForm.value, { headers }).subscribe({
      next: (res) => {
        this.successMsg = res.message || 'Profile updated successfully';
        this.errorMsg = '';

        const first = res?.user?.first_name || '';
        const last = res?.user?.last_name || '';
        const fullName = `${first} ${last}`.trim() || 'User';
        const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U';
        const picture = res?.user?.profile_picture || '';

        localStorage.setItem('userName', fullName);
        localStorage.setItem('userInitials', initials);
        localStorage.setItem('profilePicture', picture);
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err.error?.message || 'Failed to update profile';
        this.successMsg = '';
      }
    });
  }

  changePassword() {
    this.passwordSubmitted = true;
    this.passwordSuccessMsg = '';
    this.passwordErrorMsg = '';

    if (this.passwordForm.invalid) {
      this.passwordErrorMsg = 'Please fill all password fields correctly';
      return;
    }

    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.passwordErrorMsg = 'New password and confirm password do not match';
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.passwordErrorMsg = 'User not logged in';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.http.put<any>('http://localhost:5000/api/auth/change-password', payload, { headers }).subscribe({
      next: (res) => {
        this.passwordSuccessMsg = res.message || 'Password changed successfully';
        this.passwordErrorMsg = '';
        this.passwordForm.reset();
        this.passwordSubmitted = false;
      },
      error: (err) => {
        console.error(err);
        this.passwordErrorMsg = err.error?.message || 'Failed to change password';
        this.passwordSuccessMsg = '';
      }
    });
  }

  get f() {
    return this.settingsForm.controls;
  }

  get pf() {
    return this.passwordForm.controls;
  }
}