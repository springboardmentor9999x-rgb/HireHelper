import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  loading = true;
  private toastService = inject(ToastService);
  private refreshSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchNotifications();

    // Listen for refresh triggers
    this.refreshSubscription = this.notificationService.refresh$.subscribe(() => {
      this.fetchNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  fetchNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.notifications || [];
        this.loading = false;
        
        // After fetching, if there are unread notifications, mark them all as read
        if (this.notifications.some(n => !n.is_read)) {
          this.markNotificationsAsRead();
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.showError('Failed to load notifications. Please try again.');
        console.error('Error fetching notifications:', err);
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
          notification.is_read = true;
          this.notificationService.triggerRefresh(); // Notify other components (like Dashboard)
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || 'Failed to mark notification as read.');
        console.error('Error marking notification as read:', err);
      }
    });
  }

  private markNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationService.triggerRefresh(); // Notify other components (like Dashboard)
      },
      error: (err) => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }
}
