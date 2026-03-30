import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class VerifyOtpComponent implements OnInit {
  verifyForm: FormGroup;
  submitted = false;
  loading = false;
  resendLoading = false;
  errorMessage = '';
  successMessage = '';
  email = '';
  resendCount = 0;
  resendCooldown = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.verifyForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d+$/)]],
    });
  }

  ngOnInit() {
    // Get email from sessionStorage
    this.email = sessionStorage.getItem('registerEmail') || '';
    if (!this.email) {
      this.errorMessage = 'Email not found. Please register again.';
      setTimeout(() => this.router.navigate(['/register']), 2000);
    }
  }

  get f() {
    return this.verifyForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.verifyForm.invalid) {
      return;
    }

    this.loading = true;
    const otp = this.verifyForm.value.otp;

    this.authService.verifyOTP(this.email, otp).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'Email verified successfully! Redirecting to login...';
          sessionStorage.removeItem('registerEmail');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.errorMessage = response.message || 'Failed to verify OTP. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid OTP. Please check and try again.';
        } else if (error.status === 410) {
          this.errorMessage = 'OTP has expired. Please request a new one.';
        } else {
          this.errorMessage = 'Verification failed. Please try again.';
        }
        console.error('OTP verification error:', error);
      },
    });
  }

  onResendOTP() {
    if (this.resendCooldown > 0) {
      return;
    }

    this.resendLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOTP(this.email).subscribe({
      next: (response: AuthResponse) => {
        this.resendLoading = false;
        if (response.success) {
          this.successMessage = 'OTP resent to your email!';
          this.resendCount++;
          this.startCooldown();
          this.verifyForm.reset();
        } else {
          this.errorMessage = response.message || 'Failed to resend OTP.';
        }
      },
      error: (error: any) => {
        this.resendLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to resend OTP. Please try again.';
        }
        console.error('Resend OTP error:', error);
      },
    });
  }

  private startCooldown() {
    this.resendCooldown = 60; // 60 second cooldown
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }
}
