import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = signal(false);
  isSubmitted = signal(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  onSubmit() {
    if (!this.email) return;

    this.isLoading.set(true);
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        this.toastService.showSuccess('Reset link sent to your email.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError(err.error?.message || 'Failed to send reset link.');
      }
    });
  }
}
