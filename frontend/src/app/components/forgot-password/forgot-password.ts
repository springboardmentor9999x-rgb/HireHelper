import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ForgotPasswordComponent implements OnInit {
  step: 'email' | 'otp' | 'password' = 'email';
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;
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
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d+$/)]],
    });
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Initialize step
    this.step = 'email';
  }

  get emailF() {
    return this.emailForm.controls;
  }

  get otpF() {
    return this.otpForm.controls;
  }

  get passwordF() {
    return this.passwordForm.controls;
  }

  // Step 1: Send OTP to email
  onRequestPasswordReset() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.emailForm.invalid) {
      return;
    }

    this.loading = true;
    this.email = this.emailF['email'].value;

    this.authService.resetOTP(this.email).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'OTP sent to your email. Please check your inbox.';
          setTimeout(() => {
            this.step = 'otp';
            this.successMessage = '';
            this.submitted = false;
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to send OTP. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 404) {
          this.errorMessage = 'Email not found. Please check and try again.';
        } else {
          this.errorMessage = 'Failed to send OTP. Please try again.';
        }
        console.error('Forgot password error:', error);
      },
    });
  }

  // Step 2: Verify OTP
  onVerifyOTP() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.otpForm.invalid) {
      return;
    }

    this.loading = true;
    const otp = this.otpF['otp'].value;

    this.authService.verifyPasswordResetOTP(this.email, otp).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'OTP verified! Now set your new password.';
          setTimeout(() => {
            this.step = 'password';
            this.successMessage = '';
            this.submitted = false;
          }, 1500);
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

  // Step 3: Reset password
  onResetPassword() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.passwordForm.invalid) {
      return;
    }

    const newPassword = this.passwordF['newPassword'].value;
    const confirmPassword = this.passwordF['confirmPassword'].value;

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please try again.';
      return;
    }

    this.loading = true;

    this.authService.resetPassword(this.email, newPassword).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'Password reset successfully! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to reset password. Please try again.';
        }
        console.error('Password reset error:', error);
      },
    });
  }

  // Resend OTP
  onResendOTP() {
    if (this.resendCooldown > 0) {
      return;
    }

    this.resendLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetOTP(this.email).subscribe({
      next: (response: AuthResponse) => {
        this.resendLoading = false;
        if (response.success) {
          this.successMessage = 'OTP resent to your email!';
          this.resendCount++;
          this.startResendCooldown();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to resend OTP. Please try again.';
        }
      },
      error: (error: any) => {
        this.resendLoading = false;
        this.errorMessage = 'Failed to resend OTP. Please try again.';
      },
    });
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  goBack() {
    if (this.step === 'otp') {
      this.step = 'email';
      this.submitted = false;
      this.errorMessage = '';
      this.successMessage = '';
    } else if (this.step === 'password') {
      this.step = 'otp';
      this.submitted = false;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}
