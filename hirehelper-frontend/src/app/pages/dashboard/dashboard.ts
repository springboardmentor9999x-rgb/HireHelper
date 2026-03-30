import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  unreadNotificationsCount = 0;
  private lastNotificationIds: Set<number> = new Set();
  private pollingSubscription?: Subscription;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.fetchUnreadNotificationsCount(true); // Initial fetch, don't show toasts
    
    // Start polling every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.fetchUnreadNotificationsCount();
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  fetchUnreadNotificationsCount(isInitial = false): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        const notifications = res.notifications || [];
        const unread = notifications.filter(n => !n.is_read);
        this.unreadNotificationsCount = unread.length;

        if (!isInitial) {
          // Check for new notifications
          unread.forEach(notification => {
            if (!this.lastNotificationIds.has(notification.id)) {
              this.toastService.showInfo(notification.body);
              this.notificationService.triggerRefresh();
            }
          });
        }

        // Update last known notification IDs
        this.lastNotificationIds = new Set(unread.map(n => n.id));
      },
      error: (err) => {
        console.error('Error fetching notifications count:', err);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
