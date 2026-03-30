import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DashboardComponent implements OnInit {
  activeTab: string = 'tasks';
  tasks: any[] = [];
  settings: any = {
    notification_email: false,
    dark_mode: false,
    profile_visibility: false
  };

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMyTasks();
    this.loadSettings();
  }

  loadMyTasks() {
    this.taskService.getMyTasks().subscribe({
      next: (response: any) => {
        this.tasks = response.data || [];
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
      }
    });
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.settings = {
            notification_email: response.data.notifications?.email || false,
            dark_mode: response.data.theme?.darkMode || false,
            profile_visibility: response.data.privacy?.profileVisibility || false
          };
        }
      },
      error: (error) => {
        console.error('Error loading settings:', error);
      }
    });
  }

  saveSettings() {
    forkJoin([
      this.settingsService.updateNotifications({
        notification_email: this.settings.notification_email,
        notification_push: false
      }),
      this.settingsService.updateTheme({
        dark_mode: this.settings.dark_mode
      }),
      this.settingsService.updatePrivacy({
        profile_visibility: this.settings.profile_visibility
      })
    ]).subscribe({
      next: () => {
        console.log('Settings saved successfully!');
      },
      error: (error) => {
        console.error('Error saving settings:', error);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userName() {
    const user = this.authService.getCurrentUser();
    return user ? user.firstName || user.email : '';
  }
}
