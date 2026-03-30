import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  processingIds: Set<string> = new Set();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.errorMessage = '';

    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.notifications = response.data || [];
        } else {
          this.errorMessage = 'Failed to load notifications';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading notifications:', error);
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else {
          this.errorMessage = 'Failed to load notifications. Please try again.';
        }
      }
    });
  }

  markAsRead(notificationId: string) {
    this.processingIds.add(notificationId);

    this.notificationService.markAsRead(notificationId).subscribe({
      next: (response: any) => {
        this.processingIds.delete(notificationId);
        if (response.success) {
          // Update local notification
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.is_read = true;
          }
          this.successMessage = 'Notification marked as read';
          setTimeout(() => {
            this.successMessage = '';
          }, 2000);
        }
      },
      error: (error: any) => {
        this.processingIds.delete(notificationId);
        console.error('Error marking notification as read:', error);
        this.errorMessage = 'Failed to mark notification as read';
      }
    });
  }

  clearAllNotifications() {
    if (confirm('Are you sure you want to mark all notifications as read?')) {
      this.notificationService.markAllAsRead().subscribe({
        next: (response: any) => {
          if (response.success) {
            // Mark all local notifications as read
            this.notifications.forEach(n => n.is_read = true);
            this.successMessage = 'All notifications marked as read';
            setTimeout(() => {
              this.successMessage = '';
            }, 2000);
          }
        },
        error: (error: any) => {
          console.error('Error marking all notifications as read:', error);
          this.errorMessage = 'Failed to mark all notifications as read';
        }
      });
    }
  }

  isProcessing(notificationId: string): boolean {
    return this.processingIds.has(notificationId);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    const parsedDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  refreshNotifications() {
    this.loadNotifications();
  }
}
