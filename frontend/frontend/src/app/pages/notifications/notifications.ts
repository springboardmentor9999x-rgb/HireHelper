import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
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
  error = '';

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
        timeout(10000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.name === 'TimeoutError'
            ? 'Notification request timed out. Check that the backend is running and then refresh.'
            : err.error?.message || 'Failed to load notifications';
          this.cdr.detectChanges();
        }
      });
  }

  deleteNotification(id: string): void {
    this.taskService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  deleteAllNotifications(): void {
    this.taskService.deleteAllNotifications().subscribe({
      next: (response) => {
        this.notifications = [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete all failed:', err);
      }
    });
  }
}
