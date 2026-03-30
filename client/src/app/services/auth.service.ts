import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
}

export type RegisterResponse = LoginResponse;

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5000/api/auth';
    private platformId = inject(PLATFORM_ID);
    private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

    constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
    }

    register(name: string, email: string, password: string, phone: string): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { name, email, password, phone });
    }

    // ── OTP ──────────────────────────────────────────────────────────────────
    sendEmailOtp(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/send-email-otp`, { email });
    }

    verifyEmailOtp(email: string, otp: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email-otp`, { email, otp });
    }

    sendPhoneOtp(phone: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/send-phone-otp`, { phone });
    }

    verifyPhoneOtp(phone: string, otp: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/verify-phone-otp`, { phone, otp });
    }

    // ── Password Reset ───────────────────────────────────────────────────────
    forgotPassword(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { email, otp, newPassword });
    }

    changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean, message: string }> {
        return this.http.put<{ success: boolean, message: string }>(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
    }

    updateProfile(name: string): Observable<{ success: boolean, message: string, name: string }> {
        return this.http.put<{ success: boolean, message: string, name: string }>(`${this.apiUrl}/update-profile`, { name });
    }

    // ── Session ───────────────────────────────────────────────────────────────
    saveSession(token: string, user: LoginResponse['user']): void {
        if (!this.isBrowser) return;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    logout(): void {
        if (!this.isBrowser) return;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isLoggedIn(): boolean {
        if (!this.isBrowser) return false;
        return !!localStorage.getItem('token');
    }

    getToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem('token');
    }

    /** Calls the protected GET /me endpoint (JWT is attached by the interceptor) */
    getMe(): Observable<{ user: LoginResponse['user'] }> {
        return this.http.get<{ user: LoginResponse['user'] }>(`${this.apiUrl}/me`);
    }

    getUser(): LoginResponse['user'] | null {
        if (!this.isBrowser) return null;
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    }
}
