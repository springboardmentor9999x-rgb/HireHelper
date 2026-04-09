import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify.html',
  styleUrls: ['./verify.css']
})
export class VerifyComponent {
  email = '';
  otp = '';
  message = '';
  errorMsg = '';
  loading = false;
  resendLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  verifyAccount() {
    if (!this.email || !this.otp) {
      this.errorMsg = 'Email and OTP are required';
      this.message = '';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.message = '';

    this.http.post<any>('http://localhost:5000/api/auth/verify-otp', {
      email: this.email.trim(),
      otp: this.otp.trim()
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message || 'Account verified successfully';
        this.errorMsg = '';
        alert('Account verified successfully');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'OTP verification failed';
        this.message = '';
      }
    });
  }

  resendOtp() {
    if (!this.email) {
      this.errorMsg = 'Please enter your email first';
      this.message = '';
      return;
    }

    this.resendLoading = true;
    this.errorMsg = '';
    this.message = '';

    this.http.post<any>('http://localhost:5000/api/auth/resend-otp', {
      email: this.email.trim()
    }).subscribe({
      next: (res) => {
        this.resendLoading = false;
        this.message = res.message || 'New OTP sent to your email';
        this.errorMsg = '';
        alert('New OTP sent to your email');
      },
      error: (err) => {
        this.resendLoading = false;
        this.errorMsg = err.error?.message || 'Failed to resend OTP';
        this.message = '';
      }
    });
  }
}