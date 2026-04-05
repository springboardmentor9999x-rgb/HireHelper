import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:5000/api';
    currentUser = signal<any>(null);

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                this.currentUser.set(JSON.parse(savedUser));
            }
        }
    }

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/register`, userData);
    }

    verifyOTP(email: string, otp: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp });
    }

    resendOTP(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/resend-otp`, { email });
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap((response: any) => {
                if (response.token && isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUser.set(response.user);
                }
            })
        );
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/profile`, data).pipe(
            tap((response: any) => {
                if (response.user && isPlatformBrowser(this.platformId)) {
                    const updatedUser = { ...this.currentUser(), ...response.user };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUser.set(updatedUser);
                }
            })
        );
    }

    updateSettings(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/settings`, data).pipe(
            tap((response: any) => {
                if (response.settings && isPlatformBrowser(this.platformId)) {
                    const updatedUser = { ...this.currentUser(), ...response.settings };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUser.set(updatedUser);
                }
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
    }

    resetPassword(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
    }

    changePassword(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/change-password`, data);
    }

    deleteAccount(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/me`).pipe(
            tap(() => this.logout())
        );
    }

    uploadProfilePicture(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('picture', file);
        return this.http.post(`${this.apiUrl}/users/profile-picture`, formData).pipe(
            tap((response: any) => {
                if (response.picture_url && isPlatformBrowser(this.platformId)) {
                    const updatedUser = { ...this.currentUser(), picture_url: response.picture_url };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUser.set(updatedUser);
                }
            })
        );
    }

    logout() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        this.currentUser.set(null);
    }

    getToken(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('token');
        }
        return null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
