import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  step: 1 | 2 = 1;

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  isSendingOtp = false;
  isResettingPassword = false;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  requestOtp() {
    this.email = this.email.trim().toLowerCase();

    if (!this.email) {
      this.toast.error('Please enter your email');
      return;
    }

    this.isSendingOtp = true;

    this.auth.forgotPassword({ email: this.email }).subscribe({
      next: (res: any) => {
        this.isSendingOtp = false;
        this.step = 2;

        if (res?.otp) {
          this.toast.info(`OTP sent. Debug OTP: ${res.otp}`, 4500);
        } else {
          this.toast.success(res?.message || 'Password reset OTP sent to your email');
        }
      },
      error: (err) => {
        this.isSendingOtp = false;
        this.toast.error(err?.error?.error || err?.error?.message || 'Failed to send OTP');
      }
    });
  }

  resetPassword() {
    if (!this.otp || !this.newPassword || !this.confirmPassword) {
      this.toast.error('Please fill all fields');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    this.isResettingPassword = true;

    this.auth.resetPassword({
      email: this.email,
      otp: this.otp,
      new_password: this.newPassword,
    }).subscribe({
      next: () => {
        this.isResettingPassword = false;
        this.toast.success('Password reset successful. Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isResettingPassword = false;
        this.toast.error(err?.error?.error || 'Failed to reset password');
      }
    });
  }
}
