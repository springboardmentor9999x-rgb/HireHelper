import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces for Settings
export interface NotificationSettings {
  email: boolean;
  push: boolean;
}

export interface ThemeSettings {
  darkMode: boolean;
}

export interface PrivacySettings {
  profileVisibility: boolean;
}

export interface UserSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  notifications: NotificationSettings;
  theme: ThemeSettings;
  language: string;
  privacy: PrivacySettings;
  lastLogin?: Date;
  memberSince: Date;
}

export interface UpdateNotificationsRequest {
  notification_email?: boolean;
  notification_push?: boolean;
}

export interface UpdateThemeRequest {
  dark_mode: boolean;
}

export interface UpdateLanguageRequest {
  language: string;
}

export interface UpdatePrivacyRequest {
  profile_visibility: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Settings Service
 * Handles all user settings and preferences API calls
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private baseUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  /**
   * Get current user settings
   */
  getSettings(): Observable<any> {
    return this.http.get<SettingsResponse>(`${this.baseUrl}`);
  }

  /**
   * Update notification preferences
   */
  updateNotifications(data: UpdateNotificationsRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/notifications`, data);
  }

  /**
   * Update dark mode preference
   */
  updateTheme(data: UpdateThemeRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/theme`, data);
  }

  /**
   * Update language preference
   */
  updateLanguage(data: UpdateLanguageRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/language`, data);
  }

  /**
   * Update privacy settings
   */
  updatePrivacy(data: UpdatePrivacyRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/privacy`, data);
  }

  /**
   * Change user password
   */
  changePassword(data: ChangePasswordRequest): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.baseUrl}/change-password`, data);
  }

  /**
   * Delete user account
   */
  deleteAccount(data: DeleteAccountRequest): Observable<SettingsResponse> {
    return this.http.delete<SettingsResponse>(`${this.baseUrl}/delete-account`, {
      body: data,
    });
  }
}
