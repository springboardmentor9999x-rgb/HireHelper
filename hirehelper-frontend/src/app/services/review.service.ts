import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
    id?: number;
    task_id: string | number;
    reviewer_id?: number;
    reviewee_id: number;
    rating: number;
    comment: string;
    created_at?: string;
    first_name?: string;
    last_name?: string;
    task_title?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private apiUrl = `${environment.apiUrl}/reviews`;

    constructor(private http: HttpClient) { }

    createReview(review: Review): Observable<any> {
        return this.http.post(this.apiUrl, review);
    }

    getReviewsForUser(userId: number): Observable<{ reviews: Review[] }> {
        return this.http.get<{ reviews: Review[] }>(`${this.apiUrl}/user/${userId}`);
    }

    getReviewsGivenByUser(userId: number): Observable<{ reviews: Review[] }> {
        return this.http.get<{ reviews: Review[] }>(`${this.apiUrl}/given/${userId}`);
    }
}
