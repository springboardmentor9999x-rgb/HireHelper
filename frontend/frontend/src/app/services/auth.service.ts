import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppUser {
  id: string;
  first_name: string;
  last_name: string;
  email_id: string;
  phone_number: string;
  is_verified: boolean;
  profile_picture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = "http://localhost:5000/api/auth";
  userBaseUrl = "http://localhost:5000/api/users";

  constructor(private http: HttpClient) {}

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  register(data:any): Observable<any>{
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data:any): Observable<any>{
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  verifyOtp(data:any): Observable<any>{
    return this.http.post(`${this.baseUrl}/verify-otp`, data);
  }

  forgotPassword(data: { email_id: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, data);
  }

  resetPassword(data: { email_id: string; otp: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/change-password`, data);
  }

  updateProfilePicture(file: File): Observable<{ message: string; profile_picture: string }> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return this.http.put<{ message: string; profile_picture: string }>(`${this.userBaseUrl}/profile-picture`, formData);
  }

  getCurrentUser(): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.userBaseUrl}/me`);
  }


  saveToken(token:string){
    if (this.hasStorage()) {
      localStorage.setItem('token', token);
    }
  }

  saveUser(user: AppUser | Record<string, unknown>): void {
    if (!this.hasStorage()) {
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    const typedUser = user as Partial<AppUser>;
    localStorage.setItem('userName', typedUser.first_name || 'User');
  }

  getStoredUser(): AppUser | null {
    if (!this.hasStorage()) {
      return null;
    }

    const user = localStorage.getItem('user');
    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AppUser;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }

  getToken(){
    return this.hasStorage() ? localStorage.getItem('token') : null;
  }

  logout(){
    if (this.hasStorage()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userName');
    }
  }

  isLoggedIn(){
    return !!this.getToken();
  }
}
