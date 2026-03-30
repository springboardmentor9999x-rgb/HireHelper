import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Base URL points directly to the auth endpoints on backend
  private baseUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'authToken';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    // call backend /register
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap((response) => {
        if (response.success) {
          console.log('Registration successful');
        }
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // call backend /login
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  verifyOTP(email: string, otp: string): Observable<AuthResponse> {
    // call backend /verify-otp
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-otp`, { email, otp });
  }

  resendOTP(email: string): Observable<AuthResponse> {
    // POST /resend-otp (for registration verification)
    return this.http.post<AuthResponse>(`${this.baseUrl}/resend-otp`, { email });
  }

  resetOTP(email: string): Observable<AuthResponse> {
    // POST /forgot-password (for password reset)
    return this.http.post<AuthResponse>(`${this.baseUrl}/forgot-password`, { email });
  }

  verifyPasswordResetOTP(email: string, otp: string): Observable<AuthResponse> {
    // POST /verify-password-reset-otp
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-password-reset-otp`, { email, otp });
  }

  resetPassword(email: string, newPassword: string): Observable<AuthResponse> {
    // POST /reset-password
    return this.http.post<AuthResponse>(`${this.baseUrl}/reset-password`, { email, newPassword });
  }

  logout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private loadUser(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
