import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: number;
  name: string;
  bio?: string;
  picture_url?: string;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  email?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/users';

  getUserProfile(userId: number): Observable<{ success: boolean; profile: UserProfile }> {
    return this.http.get<{ success: boolean; profile: UserProfile }>(`${this.apiUrl}/${userId}/profile`);
  }
}
