import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-sidebar',
  templateUrl: './notification-sidebar.html',
  styleUrls: ['./notification-sidebar.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NotificationSidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();

  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  private refreshSubscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Auto-refresh notifications every 10 seconds
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    if (!this.isOpen) return; // Don't load if sidebar is closed

    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data;
          this.updateUnreadCount();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(n => n.is_read = true);
          this.updateUnreadCount();
        }
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  close(): void {
    this.closeEvent.emit();
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }
}
