import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, RouterModule, HttpClientModule]
})
export class Dashboard implements OnInit {
  user: any = {
    first_name: 'User',
    last_name: '',
    email: '',
    profile_picture: ''
  };

  userName = 'User';
  userInitials = 'U';
  profilePicture = '';

  totalTasks = 0;
  requestsReceived = 0;
  requestsSent = 0;

  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSavedUser();
    this.loadUser();
    this.loadDashboardCounts();
    this.loadNotifications();
  }

  loadSavedUser() {
    const savedName = localStorage.getItem('userName');
    const savedInitials = localStorage.getItem('userInitials');
    const savedProfilePicture = localStorage.getItem('profilePicture');
    const savedEmail = localStorage.getItem('userEmail');

    if (savedName) this.userName = savedName;
    if (savedInitials) this.userInitials = savedInitials;
    if (savedProfilePicture) this.profilePicture = savedProfilePicture;

    const parts = this.userName.split(' ');
    this.user.first_name = parts[0] || 'User';
    this.user.last_name = parts.slice(1).join(' ') || '';
    this.user.profile_picture = this.profilePicture;
    this.user.email = savedEmail || 'user@email.com';

    this.cdr.detectChanges();
  }

  loadUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:5000/api/users/me', { headers }).subscribe({
      next: (res) => {
        const first = res?.first_name || '';
        const last = res?.last_name || '';
        const fullName = `${first} ${last}`.trim() || 'User';
        const initials =
          ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U';
        const picture = res?.profile_picture || '';
        const email = res?.email || 'user@email.com';

        this.userName = fullName;
        this.userInitials = initials;
        this.profilePicture = picture;

        this.user = {
          first_name: first,
          last_name: last,
          email: email,
          profile_picture: picture
        };

        localStorage.setItem('userName', fullName);
        localStorage.setItem('userInitials', initials);
        localStorage.setItem('profilePicture', picture);
        localStorage.setItem('userEmail', email);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('User fetch error:', err);
      }
    });
  }

  loadDashboardCounts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Total Tasks
    this.http.get<any>('http://localhost:5000/api/tasks/my', { headers }).subscribe({
      next: (res) => {
        this.totalTasks = Array.isArray(res?.tasks) ? res.tasks.length : 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Tasks error:', err);
        this.totalTasks = 0;
        this.cdr.detectChanges();
      }
    });

    // Requests Received
    this.http.get<any>('http://localhost:5000/api/requests/incoming', { headers }).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.requestsReceived = res.length;
        } else if (Array.isArray(res?.requests)) {
          this.requestsReceived = res.requests.length;
        } else {
          this.requestsReceived = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Incoming error:', err);
        this.requestsReceived = 0;
        this.cdr.detectChanges();
      }
    });

    // Requests Sent
    this.http.get<any>('http://localhost:5000/api/requests/my', { headers }).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.requestsSent = res.length;
        } else if (Array.isArray(res?.requests)) {
          this.requestsSent = res.requests.length;
        } else {
          this.requestsSent = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Sent error:', err);
        this.requestsSent = 0;
        this.cdr.detectChanges();
      }
    });
  }

  loadNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:5000/api/notifications', { headers }).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : res?.notifications || [];
        this.notifications = data;
        this.unreadCount = data.filter((n: any) => !n.is_read).length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Notification error:', err);
        this.notifications = [];
        this.unreadCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.cdr.detectChanges();
  }

  logout() {
    localStorage.clear();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}