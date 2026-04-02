import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RequestItem {
    id: number;
    task_id: string | number;
    requester_id: number;
    status: string;
    created_at: string;
    message?: string;
    title?: string;
    location?: string;
    first_name?: string;
    last_name?: string;
    owner_id?: number;
    task_status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RequestService {
    private apiUrl = `${environment.apiUrl}/requests`;

    constructor(private http: HttpClient) { }

    sendRequest(taskId: string | number, message?: string): Observable<any> {
        return this.http.post(this.apiUrl, { task_id: taskId, message });
    }

    getMyRequests(): Observable<{ requests: RequestItem[] }> {
        return this.http.get<{ requests: RequestItem[] }>(`${this.apiUrl}/my`);
    }

    getReceivedRequests(): Observable<{ requests: RequestItem[] }> {
        return this.http.get<{ requests: RequestItem[] }>(`${this.apiUrl}/received`);
    }

    updateRequestStatus(requestId: number, status: 'ACCEPTED' | 'REJECTED'): Observable<any> {
        return this.http.put(`${this.apiUrl}/${requestId}`, { status });
    }

    cancelRequest(requestId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${requestId}`);
    }
}
