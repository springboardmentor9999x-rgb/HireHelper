import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationItem {
    id: number;
    user_id: number;
    body: string;
    is_read: boolean;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notifications`;
    private refreshSubject = new Subject<void>();

    refresh$ = this.refreshSubject.asObservable();

    constructor(private http: HttpClient) { }

    triggerRefresh() {
        this.refreshSubject.next();
    }

    getNotifications(): Observable<{ notifications: NotificationItem[] }> {
        return this.http.get<{ notifications: NotificationItem[] }>(this.apiUrl);
    }

    markAsRead(id: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {});
    }
}
