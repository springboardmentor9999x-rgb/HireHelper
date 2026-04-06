import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProfileSettings {
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture: string | null;
  bio: string;
}

export interface PrivacySettings {
  show_profile_in_feed: boolean;
  allow_messages: boolean;
  show_phone_to_requesters: boolean;
  email_notifications: boolean;
}

export interface NotificationSettings {
  task_requests: boolean;
  task_updates: boolean;
  announcements: boolean;
}

export interface AllSettings {
  profile: ProfileSettings;
  privacy: PrivacySettings;
  language: { current: string; options: string[] };
  appearance: { dark_mode: boolean; theme: string };
  notifications: NotificationSettings;
  security: { last_login: string | null; created_at: string };
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  /**
   * Get all user settings
   */
  getSettings(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * Update profile settings
   */
  updateProfile(data: Partial<ProfileSettings>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data);
  }

  /**
   * Update privacy settings
   */
  updatePrivacy(data: Partial<PrivacySettings>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/privacy`, data);
  }

  /**
   * Update language preference
   */
  updateLanguage(data: { language: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/language`, data);
  }

  /**
   * Update appearance settings
   */
  updateAppearance(data: { dark_mode: boolean }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/appearance`, data);
  }

  /**
   * Update notification preferences
   */
  updateNotifications(data: Partial<NotificationSettings>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications`, data);
  }

  /**
   * Change password
   */
  changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password`, data);
  }

  /**
   * Delete account
   */
  deleteAccount(password: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-account`, {
      body: { password }
    });
  }
}
