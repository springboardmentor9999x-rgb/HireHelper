import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private location: Location,
    private http: HttpClient
  ) {}

  loginUser() {
    if (!this.email || !this.password) {
      this.errorMsg = 'Please enter email and password';
      return;
    }

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.token) {
          this.auth.saveToken(res.token);

          const headers = new HttpHeaders({
            Authorization: `Bearer ${res.token}`
          });

          this.http.get<any>('http://localhost:5000/api/users/me', { headers }).subscribe({
            next: (profile) => {
              const first = profile?.first_name || '';
              const last = profile?.last_name || '';
              const fullName = `${first} ${last}`.trim() || 'User';
              const initials =
                ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U';
              const picture = profile?.profile_picture || '';

              localStorage.setItem('userName', fullName);
              localStorage.setItem('userInitials', initials);
              localStorage.setItem('profilePicture', picture);

              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              console.error('Profile fetch after login failed:', err);
              this.router.navigate(['/dashboard']);
            }
          });
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Server Error';
      }
    });
  }

  goToVerify() {
    this.router.navigate(['/verify']);
  }

  goBack() {
    this.location.back();
  }
}