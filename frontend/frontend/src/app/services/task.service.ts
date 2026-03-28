import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, BehaviorSubject } from 'rxjs';
import { tap, take } from 'rxjs/operators';

export interface TaskPayload {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time?: string | null;
  picture: string;
}

export interface TaskItem extends TaskPayload {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export interface TaskRequest {
  id: string;
  task_id: string;
  requester_id: string;
  owner_id: string;
  status: string;
  created_at: string;
}

export interface MyRequestItem extends TaskRequest {
  title: string;
  location: string;
}

export interface ReceivedRequestItem extends TaskRequest {
  title: string;
  first_name: string;
}

export interface NotificationItem {
  id: string;
  task_id: string;
  status: string;
  created_at: string;
  audience: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = 'http://localhost:5000/api/tasks';
  private readonly requestUrl = 'http://localhost:5000/api/requests';
  private readonly pendingTaskKey = 'pendingCreatedTask';
  private notificationSubject = new BehaviorSubject<number>(0);
  notifications$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient) {}

  addTask(data: TaskPayload): Observable<{ message: string; task: TaskItem }> {
    return this.http.post<{ message: string; task: TaskItem }>(this.baseUrl, data);
  }

  getMyTasks(): Observable<TaskItem[]> {
    return this.http.get<unknown>(`${this.baseUrl}/my`).pipe(
      map((response) => this.normalizeTaskList(response))
    );
  }

  getFeedTasks(): Observable<TaskItem[]> {
    return this.http.get<unknown>(this.baseUrl).pipe(
      map((response) => this.normalizeTaskList(response))
    );
  }

  updateTask(taskId: string, data: TaskPayload): Observable<{ message: string; task: TaskItem }> {
    return this.http.put<{ message: string; task: TaskItem }>(`${this.baseUrl}/${taskId}`, data);
  }

  deleteTask(taskId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${taskId}`);
  }

  closeTask(taskId: string): Observable<{ message: string; task: TaskItem }> {
    return this.http.put<{ message: string; task: TaskItem }>(`${this.baseUrl}/${taskId}/close`, {});
  }

  reopenTask(taskId: string): Observable<{ message: string; task: TaskItem }> {
    return this.http.put<{ message: string; task: TaskItem }>(`${this.baseUrl}/${taskId}/reopen`, {});
  }

  requestTask(taskId: string): Observable<{ message: string; request: TaskRequest }> {
    return this.http.post<{ message: string; request: TaskRequest }>(this.requestUrl, {
      task_id: taskId
    });
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>('http://localhost:5000/api/notifications').pipe(
      tap(notifications => this.notificationSubject.next(notifications.length))
    );
  }

  deleteNotification(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`http://localhost:5000/api/notifications/${id}`).pipe(
      tap(() => this.refreshNotificationCount())
    );
  }

  deleteAllNotifications(): Observable<{ message: string; deletedCount: number }> {
    return this.http.delete<{ message: string; deletedCount: number }>('http://localhost:5000/api/notifications').pipe(
      tap(() => this.notificationSubject.next(0))
    );
  }

  private refreshNotificationCount(): void {
    this.getNotifications().pipe(take(1)).subscribe(notifs => {
      this.notificationSubject.next(notifs.length);
    });
  }

  updateRequestStatus(requestId: string, status: 'ACCEPTED' | 'REJECTED'): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.requestUrl}/${requestId}`, { status });
  }

  getMyRequests(): Observable<MyRequestItem[]> {
    return this.http.get<MyRequestItem[]>(`${this.requestUrl}/my`);
  }

  getReceivedRequests(): Observable<ReceivedRequestItem[]> {
    return this.http.get<ReceivedRequestItem[]>(`${this.requestUrl}/received`);
  }

  savePendingTask(task: TaskItem): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.pendingTaskKey, JSON.stringify(task));
  }

  getPendingTask(): TaskItem | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    const task = localStorage.getItem(this.pendingTaskKey);
    if (!task) {
      return null;
    }

    try {
      return JSON.parse(task) as TaskItem;
    } catch {
      localStorage.removeItem(this.pendingTaskKey);
      return null;
    }
  }

  clearPendingTask(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.pendingTaskKey);
  }

  private normalizeTaskList(response: unknown): TaskItem[] {
    if (Array.isArray(response)) {
      return response as TaskItem[];
    }

    if (response && typeof response === 'object') {
      const candidate = response as { tasks?: unknown; rows?: unknown };

      if (Array.isArray(candidate.tasks)) {
        return candidate.tasks as TaskItem[];
      }

      if (Array.isArray(candidate.rows)) {
        return candidate.rows as TaskItem[];
      }
    }

    return [];
  }
}
