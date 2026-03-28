import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginData = {
    email: '',
    password: ''
  };

  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.loginData.email = this.loginData.email.trim().toLowerCase();

    this.auth.login(this.loginData).subscribe(
      (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('refreshToken', res.refresh);

        if (res.user) {
          localStorage.setItem('userRole', res.user.role);
          localStorage.setItem('userName', res.user.name);
          localStorage.setItem('userEmail', res.user.email);
          localStorage.setItem('userId', String(res.user.id));
          localStorage.setItem('userProfilePicture', res.user.profile_picture || '');
        }

        this.toast.success('Login successful');
        this.router.navigate(['/dashboard']);
      },
      (err) => {
        console.error('Login error:', err);
        const msg = err?.error?.error || 'Invalid Credentials';

        if (msg === 'Account not verified') {
          localStorage.setItem('pendingOtpEmail', this.loginData.email);
          localStorage.setItem('pendingOtpTriggerResend', 'true');
          this.toast.warning('Account not verified. A new OTP will be sent to your email.');
          this.router.navigate(['/otp']);
          return;
        }

        this.toast.error(msg);
      }
    );
  }
}
