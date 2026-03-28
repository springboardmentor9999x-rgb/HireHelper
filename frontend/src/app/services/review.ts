import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = 'http://127.0.0.1:8000/api/tasks/';

  constructor(private http: HttpClient) {}

  submitReview(taskId: number, rating: number, comment: string): Observable<any> {
    return this.http.post(`${this.baseUrl}review/${taskId}/`, {
      rating,
      comment
    });
  }

  getUserReviews(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}user-reviews/${userId}/`);
  }
}
