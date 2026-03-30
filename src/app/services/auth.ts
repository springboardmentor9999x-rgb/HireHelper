import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProfile(): Observable<any> {
    return this.http.get('http://localhost:5000/api/users/me', {
      headers: this.getAuthHeaders()
    });
  }

  requestTask(task_id: number): Observable<any> {
    return this.http.post(
      'http://localhost:5000/api/requests',
      { task_id },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getMyRequests(): Observable<any> {
    return this.http.get(
      'http://localhost:5000/api/requests/my',
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getReceivedRequests(): Observable<any> {
    return this.http.get(
      'http://localhost:5000/api/requests/incoming',
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  updateRequestStatus(requestId: number, status: 'ACCEPTED' | 'REJECTED'): Observable<any> {
    return this.http.put(
      `http://localhost:5000/api/requests/${requestId}`,
      { status },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getNotifications(): Observable<any> {
    return this.http.get(
      'http://localhost:5000/api/notifications',
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put(
      `http://localhost:5000/api/notifications/${notificationId}/read`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    );
  }
}