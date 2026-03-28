import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-layout.html',
  styleUrl: './sidebar-layout.css'
})
export class SidebarLayoutComponent {
  private readonly themeStorageKey = 'appTheme';
  isDarkTheme = false;
  unreadCount = 0;
  isSidebarOpen = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const storedTheme = localStorage.getItem(this.themeStorageKey);
    this.isDarkTheme = storedTheme === 'dark';
    this.loadProfile();
    this.loadNotificationCount();
  }

  private loadNotificationCount(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: any) => {
        this.unreadCount = notifications?.length || 0;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  get userName(): string {
    return localStorage.getItem('userName') || 'User';
  }

  get userEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  get userProfilePicture(): string {
    return localStorage.getItem('userProfilePicture') || '';
  }

  get userRating(): string {
    const rating = localStorage.getItem('userRating');
    return rating && rating !== '0.0' ? rating : '';
  }

  get role(): string {
    return (localStorage.getItem('userRole') || 'helper').trim().toUpperCase();
  }

  get isEmployer(): boolean {
    return this.role === 'HIRER';
  }

  get isHelper(): boolean {
    return this.role === 'HELPER';
  }

  get themeLabel(): string {
    return this.isDarkTheme ? 'Dark' : 'Light';
  }

  viewNotifications(): void {
    this.unreadCount = 0;
    this.router.navigate(['/notifications']);
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem(this.themeStorageKey, this.isDarkTheme ? 'dark' : 'light');
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile: any) => {
        localStorage.setItem('userName', profile?.first_name || profile?.username || 'User');
        localStorage.setItem('userRole', profile?.role || 'helper');
        localStorage.setItem('userEmail', profile?.email || '');
        localStorage.setItem('userProfilePicture', profile?.profile_picture || '');
        localStorage.setItem('userRating', String(profile?.average_rating || '0.0'));
      },
      error: () => {
        // Keep showing stored values when profile request fails.
      }
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
