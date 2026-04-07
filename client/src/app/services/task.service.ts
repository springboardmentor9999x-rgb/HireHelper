import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Task {
    id?: number;
    user_id?: number;
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time?: string;
    picture_url?: string;
    pay?: number;
    status?: string;
    created_at?: string;
    has_requested?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = 'http://localhost:5000/api/tasks';

    constructor(private http: HttpClient) { }

    getTaskById(id: number): Observable<{ success: boolean, task: Task }> {
        return this.http.get<{ success: boolean, task: Task }>(`${this.apiUrl}/${id}`).pipe(
            catchError(err => {
                console.error('TaskService: Error in getTaskById', err);
                return throwError(() => err);
            })
        );
    }

    createTask(task: Task): Observable<{ success: boolean, task: Task }> {
        console.log('TaskService: Creating task...', task);
        return this.http.post<{ success: boolean, task: Task }>(this.apiUrl, task).pipe(
            catchError(err => {
                console.error('TaskService: Error in createTask', err);
                return throwError(() => err);
            })
        );
    }

    getMyTasks(): Observable<{ success: boolean, tasks: Task[] }> {
        return this.http.get<{ success: boolean, tasks: Task[] }>(`${this.apiUrl}/my`).pipe(
            catchError(err => {
                console.error('TaskService: Error in getMyTasks', err);
                return throwError(() => err);
            })
        );
    }

    getFeedTasks(): Observable<{ success: boolean, tasks: Task[] }> {
        return this.http.get<{ success: boolean, tasks: Task[] }>(this.apiUrl).pipe(
            catchError(err => {
                console.error('TaskService: Error in getFeedTasks', err);
                return throwError(() => err);
            })
        );
    }

    updateTask(id: number, task: Task): Observable<{ success: boolean, task: Task }> {
        return this.http.put<{ success: boolean, task: Task }>(`${this.apiUrl}/${id}`, task).pipe(
            catchError(err => {
                console.error('TaskService: Error in updateTask', err);
                return throwError(() => err);
            })
        );
    }

    deleteTask(id: number): Observable<{ success: boolean, message: string }> {
        return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`).pipe(
            catchError(err => {
                console.error('TaskService: Error in deleteTask', err);
                return throwError(() => err);
            })
        );
    }

    completeTask(id: number): Observable<{ success: boolean, task: Task }> {
        return this.http.patch<{ success: boolean, task: Task }>(`${this.apiUrl}/${id}/complete`, {}).pipe(
            catchError(err => {
                console.error('TaskService: Error in completeTask', err);
                return throwError(() => err);
            })
        );
    }

    updateTaskStatus(id: number, status?: string): Observable<{ success: boolean, task: Task }> {
        return this.http.patch<{ success: boolean, task: Task }>(`${this.apiUrl}/${id}/status`, status ? { status } : {}).pipe(
            catchError(err => {
                console.error('TaskService: Error in updateTaskStatus', err);
                return throwError(() => err);
            })
        );
    }
}
