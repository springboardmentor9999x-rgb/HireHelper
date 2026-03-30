import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [RouterModule, HttpClientModule]
})
export class Dashboard implements OnInit {
  userName = 'User';
  userInitials = 'U';

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.getUserProfile();
  }

getUserProfile() {
  const token = localStorage.getItem('token');

  if (!token) return;

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  this.http.get<any>('http://localhost:5000/api/users/me', { headers })
    .subscribe({
      next: (res) => {
        console.log('User profile response:', res);

        // 🔥 FIX
        this.userName = res?.first_name || res?.name || 'User';

        const first = res?.first_name || '';
        const last = res?.last_name || '';

        this.userInitials =
          ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U';
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
      }
    });
}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}