import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TaskService } from './task.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private platformId = inject(PLATFORM_ID);
    private taskService = inject(TaskService);

    private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

    private pollingInterval: any = null;
    private lastKnownTaskId: number | null = null;
    private readonly STORAGE_KEY = 'notificationsEnabled';
    private readonly LAST_ID_KEY = 'lastKnownTaskId';

    get isEnabled(): boolean {
        if (!this.isBrowser) return false;
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    }

    get permissionStatus(): NotificationPermission {
        if (!this.isBrowser || !('Notification' in window)) return 'denied';
        return Notification.permission;
    }

    /** Called once by DashboardComponent on load */
    init() {
        if (!this.isBrowser) return;
        // Restore last known task id from storage
        const saved = localStorage.getItem(this.LAST_ID_KEY);
        this.lastKnownTaskId = saved ? parseInt(saved, 10) : null;

        if (this.isEnabled && this.permissionStatus === 'granted') {
            this.startPolling();
        }
    }

    /** Request browser permission then enable polling */
    async enable(): Promise<boolean> {
        if (!this.isBrowser || !('Notification' in window)) return false;

        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission === 'granted') {
            localStorage.setItem(this.STORAGE_KEY, 'true');
            this.startPolling();
            return true;
        } else {
            localStorage.setItem(this.STORAGE_KEY, 'false');
            return false;
        }
    }

    disable() {
        localStorage.setItem(this.STORAGE_KEY, 'false');
        this.stopPolling();
    }

    private startPolling() {
        this.stopPolling();
        // Set baseline on first poll
        this.checkForNewTasks(this.lastKnownTaskId === null);
        this.pollingInterval = setInterval(() => {
            this.checkForNewTasks(false);
        }, 30_000);
    }

    private stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private checkForNewTasks(isBaseline = false) {
        this.taskService.getFeedTasks().subscribe({
            next: (res) => {
                if (!res.tasks || res.tasks.length === 0) return;

                const maxId = Math.max(...res.tasks.map(t => (t as any)._id ? 0 : (t.id || 0)));
                // Support both numeric id and MongoDB _id (use index as proxy)
                const latestTask = res.tasks[0];

                if (isBaseline) {
                    this.lastKnownTaskId = maxId || res.tasks.length;
                    localStorage.setItem(this.LAST_ID_KEY, String(this.lastKnownTaskId));
                    return;
                }

                const currentCount = maxId || res.tasks.length;
                const baseline = this.lastKnownTaskId ?? 0;

                if (currentCount > baseline) {
                    this.fireNotification(latestTask.title, latestTask.location);
                    this.lastKnownTaskId = currentCount;
                    localStorage.setItem(this.LAST_ID_KEY, String(currentCount));
                }
            },
            error: () => { /* silent — user may not be connected */ }
        });
    }

    private fireNotification(title: string, body: string) {
        if (!this.isBrowser || Notification.permission !== 'granted') return;
        const n = new Notification(`🔔 New Task: ${title}`, {
            body: body || 'A new task is available near you.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'hire-helper-task',
        });
        n.onclick = () => window.focus();
    }
}
