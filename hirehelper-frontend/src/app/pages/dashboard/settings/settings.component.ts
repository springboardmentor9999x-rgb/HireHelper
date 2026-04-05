import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  settings = {
    notifications_enabled: true
  };
  
  passwordData = {
    old_password: '',
    new_password: '',
    confirm_password: ''
  };

  isLoading = signal(false);
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.settings.notifications_enabled = user.notifications_enabled ?? true;
    }
  }

  saveSettings() {
    this.isLoading.set(true);
    this.authService.updateSettings(this.settings).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.showSuccess('Preferences updated and synchronized.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError('Failed to save preferences.');
      }
    });
  }

  changePassword() {
    if (this.passwordData.new_password !== this.passwordData.confirm_password) {
      this.toastService.showError('New passwords do not match.');
      return;
    }

    this.isChangingPassword.set(true);
    this.authService.changePassword({
      old_password: this.passwordData.old_password,
      new_password: this.passwordData.new_password
    }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordData = { old_password: '', new_password: '', confirm_password: '' };
        this.toastService.showSuccess('Password updated successfully.');
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.toastService.showError(err.error?.message || 'Failed to change password.');
      }
    });
  }

  deleteAccount() {
    if (confirm('Are you sure you want to permanently DELETE your account? This action cannot be undone.')) {
      this.isDeletingAccount.set(true);
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.toastService.showSuccess('Account deleted successfully.');
          window.location.href = '/login';
        },
        error: (err) => {
          this.isDeletingAccount.set(false);
          this.toastService.showError('Failed to delete account.');
        }
      });
    }
  }
}
