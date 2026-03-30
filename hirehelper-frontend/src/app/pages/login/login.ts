import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected email = '';
  protected password = '';
  protected isLoading = signal(false);
  private toastService = inject(ToastService);

  // Field errors
  protected emailError = signal('');
  protected passwordError = signal('');

  constructor(private authService: AuthService, private router: Router) { }

  validateEmail(): boolean {
    const val = this.email.trim();
    if (!val) {
      this.emailError.set('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      this.emailError.set('Please enter a valid email address.');
      return false;
    }
    this.emailError.set('');
    return true;
  }

  validatePassword(): boolean {
    if (!this.password) {
      this.passwordError.set('Password is required.');
      return false;
    }
    this.passwordError.set('');
    return true;
  }

  onSubmit() {
    const v1 = this.validateEmail();
    const v2 = this.validatePassword();

    if (!v1 || !v2) return;

    this.isLoading.set(true);

    const creds = { email: this.email.trim().toLowerCase(), password: this.password };
    this.authService.login(creds).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.showSuccess('Login successful! Welcome back.');
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 403) {
          this.toastService.showInfo('Account not verified. Redirecting...');
          setTimeout(() => {
            this.router.navigate(['/verify-otp'], { queryParams: { email: this.email.trim().toLowerCase() } });
          }, 1500);
        } else {
          this.toastService.showError(err.error?.message || 'Login failed. Please check your credentials.');
        }
        console.error('Login error:', err);
      }
    });
  }
}
