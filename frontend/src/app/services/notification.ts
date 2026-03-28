import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  api = 'http://127.0.0.1:8000/api/notifications/';

  constructor(private http: HttpClient) {}

  getNotifications() {
    return this.http.get(this.api);
  }

  deleteNotification(id: number) {
    return this.http.delete(`${this.api}${id}/`);
  }
}
