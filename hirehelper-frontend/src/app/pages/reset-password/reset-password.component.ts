import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  isSuccess = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.toastService.showError('Invalid or missing reset token.');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.toastService.showError('Passwords do not match.');
      return;
    }

    if (this.password.length < 8) {
      this.toastService.showError('Password must be at least 8 characters.');
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword({ token: this.token, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.toastService.showSuccess('Password reset successful! You can now login.');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
