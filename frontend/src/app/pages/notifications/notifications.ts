import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification';
import { ToastService } from '../../services/toast';

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

  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res || [];
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load notifications');
        this.loading = false;
      }
    });
  }

  handleNotificationClick(notification: any) {
    const routeLink = notification.link;
    
    // Delete (or 'mark as read') the notification when clicked
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (routeLink) {
          this.router.navigate([routeLink]);
        }
      },
      error: () => {
         // Even if delete fails, still follow the link
         if (routeLink) {
           this.router.navigate([routeLink]);
         }
      }
    });
  }
}
