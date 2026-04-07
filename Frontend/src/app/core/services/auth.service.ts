import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  verifyOtp(email_id: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email_id, otp });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/users/me`);
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/users/me`, formData).pipe(
      tap((res: any) => {
        if (res) {
          localStorage.setItem('user', JSON.stringify(res));
        }
      })
    );
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/users/settings`, settings);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && token !== 'undefined' && token !== 'null';
  }
}
