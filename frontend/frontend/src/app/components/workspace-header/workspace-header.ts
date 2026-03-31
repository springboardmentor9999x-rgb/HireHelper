import { ChangeDetectorRef, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AppUser } from '../../services/auth.service';
import { NotificationItem, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspace-header.html',
  styleUrls: ['./workspace-header.css']
})
export class WorkspaceHeaderComponent implements OnInit, OnDestroy {
  private readonly apiOrigin = 'http://localhost:5000';
  @Input() sectionLabel = 'Workspace';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() panelLabel = '';
  @Input() panelValue: string | number = '';
  @Input() compactProfile = false;

  user: AppUser | null = null;
  notifications: NotificationItem[] = [];
  showNotifications = false;
  showProfileMenu = false;
  hasNotificationDot = false;
  private latestNotificationId: string | null = null;
  private notificationPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private auth: AuthService,
    private taskService: TaskService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      this.user = user
        ? {
            ...user,
            profile_picture: this.normalizeProfilePictureUrl(user.profile_picture)
          }
        : null;
      this.cdr.detectChanges();
    });

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        const normalizedUser = {
          ...user,
          profile_picture: this.normalizeProfilePictureUrl(user.profile_picture)
        };
        this.auth.saveUser(normalizedUser);
        this.cdr.detectChanges();
      }
    });

    this.loadNotifications(true);
    this.notificationPollTimer = setInterval(() => this.loadNotifications(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.notificationPollTimer) {
      clearInterval(this.notificationPollTimer);
      this.notificationPollTimer = null;
    }
  }

  markAllAsRead(): void {
    this.taskService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
        this.hasNotificationDot = false;
        this.loadNotifications(false); // Reload to sync with backend
      },
      error: (err) => console.error('Mark all read failed:', err)
    });
  }

  onNotificationButtonClick(): void {
    this.showProfileMenu = false;
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.hasNotificationDot = false;
    }
  }

  onProfileButtonClick(): void {
    this.showNotifications = false;
    this.showProfileMenu = !this.showProfileMenu;
  }

  goToProfile(): void {
    this.showProfileMenu = false;
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.showProfileMenu = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrap')) {
      this.showNotifications = false;
    }
    if (!target.closest('.profile-wrap')) {
      this.showProfileMenu = false;
    }
  }

  get userName(): string {
    if (!this.user) {
      return 'User';
    }

    return `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || this.user.first_name || 'User';
  }

  get userInitial(): string {
    return (this.user?.first_name || 'U').charAt(0).toUpperCase();
  }

  private normalizeProfilePictureUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${this.apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private loadNotifications(isInitialLoad: boolean): void {
    this.taskService.getNotifications().subscribe({
      next: (notifications) => {
        const sorted = [...notifications].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.notifications = sorted;

        const newestId = sorted[0]?.id || null;
        if (isInitialLoad) {
          this.latestNotificationId = newestId;
          return;
        }

        if (newestId && this.latestNotificationId && newestId !== this.latestNotificationId) {
          this.hasNotificationDot = true;
        }

        if (newestId) {
          this.latestNotificationId = newestId;
        }
      },
      error: (err) => {
        console.error('Load notifications failed:', err);
        this.notifications = [];
      }
    });
  }
}
