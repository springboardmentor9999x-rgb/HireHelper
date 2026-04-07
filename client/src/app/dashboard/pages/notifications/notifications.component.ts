import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotificationService, AppNotification } from '../../../services/app-notification.service';
import { DashboardComponent } from '../../dashboard.component';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
    private notificationService = inject(AppNotificationService);
    private dashboard = inject(DashboardComponent);
    private chatService = inject(ChatService);

    notifications: AppNotification[] = [];
    loading = true;
    error = '';
    private notificationSubscription?: Subscription;

    ngOnInit(): void {
        this.fetchNotifications();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
    }

    setupRealTimeUpdates(): void {
        this.notificationSubscription = this.chatService.onNewNotification().subscribe(() => {
            this.fetchNotifications();
        });
    }

    fetchNotifications(): void {
        this.loading = true;
        this.notificationService.getNotifications().subscribe({
            next: (res) => {
                this.notifications = res.notifications;
                this.loading = false;
                this.updateDashboardBadge();
            },
            error: (err) => {
                console.error('Error fetching notifications:', err);
                this.error = 'Failed to load notifications.';
                this.loading = false;
            }
        });
    }

    markAsRead(id: number): void {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.is_read) {
            this.notificationService.markAsRead(id).subscribe({
                next: () => {
                    notif.is_read = true;
                    this.updateDashboardBadge();
                },
                error: (err) => console.error('Error marking as read:', err)
            });
        }
    }

    markAllAsRead(): void {
        const unreadTasks = this.notifications.filter(n => !n.is_read);
        if (unreadTasks.length === 0) return;

        this.notificationService.markAllAsRead().subscribe({
            next: () => {
                this.notifications.forEach(n => n.is_read = true);
                this.updateDashboardBadge();
            },
            error: (err) => console.error('Error marking all as read:', err)
        });
    }

    private updateDashboardBadge(): void {
        const unreadCount = this.notifications.filter(n => !n.is_read).length;
        this.dashboard.unreadCount.set(unreadCount);
    }

    getGroupedNotifications() {
        const groups: { [key: string]: AppNotification[] } = {
            'Today': [],
            'Yesterday': [],
            'Earlier': []
        };

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        this.notifications.forEach(n => {
            const date = new Date(n.created_at);
            if (this.isSameDay(date, today)) {
                groups['Today'].push(n);
            } else if (this.isSameDay(date, yesterday)) {
                groups['Yesterday'].push(n);
            } else {
                groups['Earlier'].push(n);
            }
        });

        // Remove empty groups and return as array for easier iteration in template
        return Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([title, items]) => ({ title, items }));
    }

    private isSameDay(d1: Date, d2: Date): boolean {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }
}
