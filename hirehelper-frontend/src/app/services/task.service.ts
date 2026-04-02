import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
    id?: string;
    user_id?: string;
    assignee_id?: string;
    title: string;
    description?: string;
    location: string;
    start_time: string;
    end_time?: string;
    picture_url?: string;
    status?: string;
    category?: string;
    is_verified?: boolean;
    created_at?: string;
    proof_note?: string;
    proof_picture_url?: string;
}

export const TASK_CATEGORIES = ['All', 'Moving', 'Cleaning', 'IT Help', 'Delivery', 'Errands', 'Other'];

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    createTask(task: Task): Observable<any> {
        return this.http.post(this.apiUrl, task);
    }

    getMyTasks(): Observable<{ tasks: Task[] }> {
        return this.http.get<{ tasks: Task[] }>(`${this.apiUrl}/my`);
    }

    getFeedTasks(search?: string, category?: string): Observable<{ tasks: Task[] }> {
        let params = new HttpParams();
        if (search) params = params.set('q', search);
        if (category && category !== 'All') params = params.set('category', category);
        return this.http.get<{ tasks: Task[] }>(this.apiUrl, { params });
    }

    markAsCompleted(taskId: string, proof: { proof_note?: string; proof_picture_url?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/${taskId}/complete`, proof);
    }

    updateTask(taskId: string, task: Partial<Task>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${taskId}`, task);
    }

    verifyCompletion(taskId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${taskId}/verify`, {});
    }

    cancelTask(taskId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${taskId}/cancel`, {});
    }

    unassignTask(taskId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${taskId}/unassign`, {});
    }
}
