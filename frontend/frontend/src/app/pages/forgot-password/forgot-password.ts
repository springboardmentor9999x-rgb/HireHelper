import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  email = '';
  otp = '';
  password = '';
  message = '';
  error = '';
  otpSent = false;
  passwordReset = false;

  isSubmitting = false;
  isSendingOtp = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  sendOtp(): void {
    if (this.isSendingOtp) {
      return;
    }

    this.message = '';
    this.error = '';
    this.passwordReset = false;
    this.otpSent = true;
    this.isSendingOtp = true;

    this.auth.forgotPassword({
      email_id: this.email.trim().toLowerCase()
    })
    .pipe(
      finalize(() => {
        this.isSendingOtp = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        this.otpSent = true;
        this.message = `${response.message}. Enter that OTP in the field below.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send reset OTP';
        this.cdr.detectChanges();
      }
    });
  }

  resetPassword(): void {
    this.message = '';
    this.error = '';
    this.isSubmitting = true;

    this.auth.resetPassword({
      email_id: this.email.trim().toLowerCase(),
      otp: this.otp.trim(),
      password: this.password
    })
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        this.passwordReset = true;
        this.message = `${response.message}. Redirecting to login...`;
        this.error = '';
        this.otp = '';
        this.password = '';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reset password';
        this.cdr.detectChanges();
      }
    });
  }
}
