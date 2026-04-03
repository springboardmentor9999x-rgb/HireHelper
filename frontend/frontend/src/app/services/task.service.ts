import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, BehaviorSubject, of } from 'rxjs';
import { tap, take } from 'rxjs/operators';

export interface TaskPayload {
  title: string;
  description: string;
  location: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  tools_required: boolean;
  vehicle_required: boolean;
  contact_method: string;
  budget: number;
  helpers_needed: number;
  duration_hours: number;
  special_instructions?: string | null;
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
  category?: string;
  urgency?: string;
  tools_required?: boolean;
  vehicle_required?: boolean;
  contact_method?: string;
  budget?: number;
  helpers_needed?: number;
  duration_hours?: number;
  special_instructions?: string;
}

export interface ReceivedRequestItem extends TaskRequest {
  title: string;
  first_name: string;
  category?: string;
  urgency?: string;
  tools_required?: boolean;
  vehicle_required?: boolean;
  contact_method?: string;
  budget?: number;
  helpers_needed?: number;
  duration_hours?: number;
  special_instructions?: string;
}

export interface NotificationItem {
  id: string;
  task_id?: string;
  status?: string;
  created_at: string;
  audience?: string;
  message: string;
  is_read?: boolean;
  requester_name?: string;
  task_title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = 'http://localhost:5000/api/tasks';
  private readonly requestUrl = 'http://localhost:5000/api/requests';
  private readonly pendingTaskKey = 'pendingCreatedTask';
  private readonly localNotificationsKey = 'hirehelper_local_notifications';
  private readonly offersStorageKeyPrefix = 'hirehelper_offers';
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
    return this.http.get<unknown>('http://localhost:5000/api/notifications').pipe(
      map((response) => {
        const notifications = [
          ...this.getLocalNotifications(),
          ...this.normalizeNotificationList(response)
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return notifications;
      }),
      tap((notifications) => this.notificationSubject.next(notifications.length))
    );
  }

  deleteNotification(id: string): Observable<{ message: string }> {
    if (this.isLocalNotification(id)) {
      this.removeLocalNotification(id);
      this.refreshNotificationCount();
      return of({ message: 'Notification deleted successfully' });
    }

    return this.http.delete<{ message: string }>(`http://localhost:5000/api/notifications/${id}`).pipe(
      tap(() => this.refreshNotificationCount())
    );
  }

  deleteAllNotifications(): Observable<{ message: string; deletedCount: number }> {
    return this.http.delete<{ message: string; deletedCount: number }>('http://localhost:5000/api/notifications').pipe(
      tap(() => {
        this.clearLocalNotifications();
        this.notificationSubject.next(0);
      })
    );
  }

  markAllNotificationsAsRead(): Observable<{ message: string; updatedCount: number }> {
    return this.http.put<{ message: string; updatedCount: number }>('http://localhost:5000/api/notifications/read-all', {}).pipe(
      tap(() => this.markLocalNotificationsAsRead())
    );
  }

  addLocalNotification(message: string, taskId?: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const notifications = this.getLocalNotifications();
    notifications.unshift({
      id: `local-${crypto.randomUUID()}`,
      task_id: taskId,
      message: trimmedMessage,
      created_at: new Date().toISOString(),
      is_read: false
    });

    this.saveLocalNotifications(notifications);
    this.refreshNotificationCount();
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

  getStoredOffersForUser<T>(userId: string): T[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }

    const storageKey = this.getOffersStorageKey(userId);
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }

  saveOffersForUser<T>(userId: string, offers: T[]): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const storageKey = this.getOffersStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(offers));
  }

  private getOffersStorageKey(userId: string): string {
    return `${this.offersStorageKeyPrefix}_${userId}`;
  }

  private getLocalNotifications(): NotificationItem[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.localNotificationsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as NotificationItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(this.localNotificationsKey);
      return [];
    }
  }

  private saveLocalNotifications(notifications: NotificationItem[]): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.localNotificationsKey, JSON.stringify(notifications));
  }

  private removeLocalNotification(id: string): void {
    const notifications = this.getLocalNotifications().filter((notification) => notification.id !== id);
    this.saveLocalNotifications(notifications);
  }

  private clearLocalNotifications(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.localNotificationsKey);
  }

  private markLocalNotificationsAsRead(): void {
    const notifications = this.getLocalNotifications().map((notification) => ({
      ...notification,
      is_read: true
    }));
    this.saveLocalNotifications(notifications);
  }

  private isLocalNotification(id: string): boolean {
    return id.startsWith('local-');
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

  private normalizeNotificationList(response: unknown): NotificationItem[] {
    if (Array.isArray(response)) {
      return response as NotificationItem[];
    }

    if (response && typeof response === 'object') {
      const candidate = response as { notifications?: unknown; rows?: unknown; data?: unknown };

      if (Array.isArray(candidate.notifications)) {
        return candidate.notifications as NotificationItem[];
      }

      if (Array.isArray(candidate.rows)) {
        return candidate.rows as NotificationItem[];
      }

      if (Array.isArray(candidate.data)) {
        return candidate.data as NotificationItem[];
      }
    }

    return [];
  }
}
