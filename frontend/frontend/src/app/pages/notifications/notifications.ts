import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationItem, TaskService } from '../../services/task.service';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit {
  trackById(index: number, notification: NotificationItem): string {
    return notification.id;
  }
  notifications: NotificationItem[] = [];
  loading = true;
  markingAllRead = false;
  error = '';

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadNotifications(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getNotifications()
      .pipe(
        timeout(10000)
      )
      .subscribe({
        next: (notifications) => {
          this.notifications = [...notifications].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          this.loading = false;
        },
        error: (err) => {
          this.error = err.name === 'TimeoutError'
            ? 'Notification request timed out. Check that the backend is running and then refresh.'
            : err.error?.message || 'Failed to load notifications';
          this.loading = false;
        }
      });
  }

  deleteNotification(id: string): void {
    this.taskService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  deleteAllNotifications(): void {
    this.taskService.deleteAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
      },
      error: (err) => {
        console.error('Delete all failed:', err);
      }
    });
  }

  markAllAsRead(): void {
    if (this.markingAllRead || this.notifications.length === 0 || this.allRead) {
      return;
    }

    this.markingAllRead = true;
    this.taskService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          is_read: true
        }));
        this.markingAllRead = false;
      },
      error: (err) => {
        console.error('Mark all as read failed:', err);
        this.markingAllRead = false;
      }
    });
  }

  get allRead(): boolean {
    return this.notifications.length > 0 && this.notifications.every((notification) => !!notification.is_read);
  }
}
