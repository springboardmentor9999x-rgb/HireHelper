import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture?: string;
  created_at: string;
}

export interface ActivityStats {
  total_tasks_created: number;
  tasks_completed: number;
  tasks_pending: number;
  requests_received: number;
  requests_sent: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  /**
   * Get logged-in user's profile
   */
  getProfile(): Observable<{ success: boolean; data: UserProfile }> {
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.apiUrl}/me`);
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: Partial<UserProfile>): Observable<{ success: boolean; message: string; data: UserProfile }> {
    return this.http.put<{ success: boolean; message: string; data: UserProfile }>(
      `${this.apiUrl}/update`,
      profileData
    );
  }

  /**
   * Change password
   */
  changePassword(passwords: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/change-password`,
      passwords
    );
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File): Observable<{ success: boolean; message: string; data: UserProfile }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ success: boolean; message: string; data: UserProfile }>(
      `${this.apiUrl}/upload-picture`,
      formData
    );
  }

  /**
   * Get user activity statistics
   */
  getActivity(): Observable<{ success: boolean; data: ActivityStats }> {
    return this.http.get<{ success: boolean; data: ActivityStats }>(`${this.apiUrl}/activity`);
  }

  /**
   * Delete user account
   */
  deleteAccount(password: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/delete-account`, {
      body: { password }
    });
  }
}
