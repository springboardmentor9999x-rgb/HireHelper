import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = true;
  errorMsg = '';
  labels: any = {};

  constructor(
    private notificationService: NotificationService,
    private langService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.langService.lang$.subscribe(() => {
      this.labels = this.langService.getLabels();
    });
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load notifications.';
        this.isLoading = false;
      }
    });
  }

  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  onNotificationClick(notif: Notification) {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.read = true;
          this.navigate(notif);
        },
        error: (err) => {
          console.error('Failed to mark as read', err);
          this.navigate(notif);
        }
      });
    } else {
      this.navigate(notif);
    }
  }

  private navigate(notif: Notification) {
    if (notif.link) {
      this.router.navigate([notif.link]);
    }
  }
}
