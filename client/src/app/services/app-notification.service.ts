import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppNotification {
    id: number;
    user_id: number;
    message: string;
    type: string;
    reference_id: number | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationResponse {
    success: boolean;
    notifications: AppNotification[];
}

@Injectable({
    providedIn: 'root'
})
export class AppNotificationService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/notifications';

    getNotifications(): Observable<NotificationResponse> {
        return this.http.get<NotificationResponse>(this.apiUrl);
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/read-all`, {});
    }
}
