import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  user_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Get user notifications
   */
  getNotifications(): Observable<{ success: boolean; data: Notification[] }> {
    return this.http.get<{ success: boolean; data: Notification[] }>(this.apiUrl);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/read/${notificationId}`,
      {}
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<{ success: boolean; message: string; data: Notification[] }> {
    return this.http.put<{ success: boolean; message: string; data: Notification[] }>(
      `${this.apiUrl}/read-all`,
      {}
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<{ success: boolean; count: number }> {
    return this.http.get<{ success: boolean; count: number }>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Create a notification (admin/system use)
   */
  createNotification(userId: string, body: string): Observable<{ success: boolean; message: string; data: Notification }> {
    return this.http.post<{ success: boolean; message: string; data: Notification }>(
      `${this.apiUrl}/create`,
      { userId, body }
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${notificationId}`
    );
  }
}
