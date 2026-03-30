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
  errorMessage = '';
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to load notifications. Please try again.';
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
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || 'Failed to mark notification as read.');
        console.error('Error marking notification as read:', err);
      }
    });
  }
}
