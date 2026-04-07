import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RatingData {
  taskId: number;
  score: number;
  comment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/ratings';

  submitRating(data: RatingData): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.apiUrl, data);
  }
}
