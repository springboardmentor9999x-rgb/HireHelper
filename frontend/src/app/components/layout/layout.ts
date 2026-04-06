import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationSidebarComponent } from '../notification-sidebar/notification-sidebar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { interval, Subscription } from 'rxjs';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, NotificationSidebarComponent]
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  notificationCount = 0;
  showNotificationDropdown = false;
  showNotificationSidebar = false;
  notifications: any[] = [];
  private notificationSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Load user profile from API
    this.loadUserProfile();

    // Load notifications on init
    this.loadNotifications();

    // Poll for new notifications every 10 seconds
    this.notificationSubscription = interval(10000).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  /**
   * Load user profile from /api/users/me
   */
  loadUserProfile(): void {
    const apiUrl = `${environment.apiUrl}/users/me`;
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUser = {
            id: response.data.id,
            email: response.data.email || '',
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            profile_picture: response.data.profile_picture || null
          };
          console.log('✅ User profile loaded:', this.currentUser);
        }
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // If profile loading fails, still try to use auth service data
        this.authService.currentUser$.subscribe((user) => {
          if (user) {
            this.currentUser = user;
          }
        });
      }
    });
  }

  loadNotifications() {
    const apiUrl = `${environment.apiUrl}/notifications`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data;
          this.notificationCount = response.data.filter((n: any) => !n.is_read).length;
        }
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  toggleNotificationSidebar() {
    this.showNotificationSidebar = !this.showNotificationSidebar;
  }

  closeNotificationSidebar() {
    this.showNotificationSidebar = false;
  }

  closeNotificationDropdown() {
    this.showNotificationDropdown = false;
  }

  /**
   * Get user's full name
   */
  getFullName(): string {
    if (this.currentUser) {
      const fullName = `${this.currentUser.first_name} ${this.currentUser.last_name}`.trim();
      return fullName || this.currentUser.email || 'User';
    }
    return 'User';
  }

  /**
   * Get first name for display
   */
  getFirstName(): string {
    if (this.currentUser?.first_name) {
      return this.currentUser.first_name.charAt(0).toUpperCase() + this.currentUser.first_name.slice(1);
    }
    return 'User';
  }

  /**
   * Get initials for avatar
   */
  getInitials(): string {
    if (this.currentUser) {
      const first = this.currentUser.first_name?.charAt(0) || '';
      const last = this.currentUser.last_name?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return 'U';
  }

  markAsRead(notificationId: number) {
    const apiUrl = `${environment.apiUrl}/notifications/read/${notificationId}`;
    
    this.http.put(apiUrl, {}).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
