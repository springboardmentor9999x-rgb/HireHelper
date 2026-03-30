import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Request {
    id?: number;
    user_id?: number;
    task_id: number;
    message?: string;
    status?: string;
    created_at?: string;
    task_title?: string;
    user_name?: string;
    user_email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RequestService {
    private apiUrl = 'http://localhost:5000/api/requests';

    constructor(private http: HttpClient) { }

    createRequest(request: Request): Observable<{ success: boolean, request: Request }> {
        return this.http.post<{ success: boolean, request: Request }>(this.apiUrl, request).pipe(
            catchError(err => {
                console.error('RequestService: Error in createRequest', err);
                return throwError(() => err);
            })
        );
    }

    getMyRequests(): Observable<{ success: boolean, requests: Request[] }> {
        return this.http.get<{ success: boolean, requests: Request[] }>(`${this.apiUrl}/me`).pipe(
            catchError(err => {
                console.error('RequestService: Error in getMyRequests', err);
                return throwError(() => err);
            })
        );
    }

    getIncomingRequests(): Observable<{ success: boolean, requests: Request[] }> {
        return this.http.get<{ success: boolean, requests: Request[] }>(`${this.apiUrl}/incoming`).pipe(
            catchError(err => {
                console.error('RequestService: Error in getIncomingRequests', err);
                return throwError(() => err);
            })
        );
    }

    getRequestsForTask(taskId: number): Observable<{ success: boolean, requests: Request[] }> {
        return this.http.get<{ success: boolean, requests: Request[] }>(`${this.apiUrl}/task/${taskId}`).pipe(
            catchError(err => {
                console.error('RequestService: Error in getRequestsForTask', err);
                return throwError(() => err);
            })
        );
    }

    updateRequestStatus(id: number, status: string): Observable<{ success: boolean, request: Request }> {
        return this.http.put<{ success: boolean, request: Request }>(`${this.apiUrl}/${id}/status`, { status }).pipe(
            catchError(err => {
                console.error('RequestService: Error in updateRequestStatus', err);
                return throwError(() => err);
            })
        );
    }
}
