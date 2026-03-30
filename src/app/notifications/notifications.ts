import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  goBack(): void {
    window.history.back();
  }

  loadNotifications(): void {
    this.loading = true;
    this.authService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  markAsRead(notificationId: number): void {
    this.authService.markNotificationAsRead(notificationId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}