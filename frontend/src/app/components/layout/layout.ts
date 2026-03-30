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
  firstName: string;
  lastName: string;
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
    // Subscribe to current user
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

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

  get firstNameDisplay(): string {
    if (this.currentUser?.firstName) {
      return this.currentUser.firstName.charAt(0).toUpperCase() + this.currentUser.firstName.slice(1);
    }
    return '';
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
