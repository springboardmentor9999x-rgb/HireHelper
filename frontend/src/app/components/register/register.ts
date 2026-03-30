import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone_number: ['', []],
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    const registrationData = {
      first_name: this.f['first_name'].value,
      last_name: this.f['last_name'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      phone_number: this.f['phone_number'].value || '',
    };

    this.authService.register(registrationData).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = response.message || 'Registration successful! Redirecting to OTP verification...';
          // Save email to sessionStorage for OTP verification
          sessionStorage.setItem('registerEmail', registrationData.email);
          setTimeout(() => {
            this.router.navigate(['/verify-otp']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'Registration failed. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        // Extract specific error messages
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage = error.error.message || 'Invalid registration data. Please check your input.';
        } else if (error.status === 409) {
          this.errorMessage = 'Email already registered. Please use a different email or login.';
        } else if (error.status === 0) {
          this.errorMessage = 'Connection error. Please check your internet and try again.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        console.error('Registration error:', error);
      },
    });
  }
}