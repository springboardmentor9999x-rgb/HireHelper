import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, AppUser } from '../../services/auth.service';
import { NotificationItem, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspace-header.html',
  styleUrls: ['./workspace-header.css']
})
export class WorkspaceHeaderComponent implements OnInit {
  @Input() sectionLabel = 'Workspace';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() panelLabel = '';
  @Input() panelValue: string | number = '';
  @Input() compactProfile = false;

  user: AppUser | null = null;
  notifications: NotificationItem[] = [];
  showNotifications = false;

  constructor(
    private auth: AuthService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getStoredUser();

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.auth.saveUser(user);
      }
    });

    this.taskService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = [...notifications]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
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
}
