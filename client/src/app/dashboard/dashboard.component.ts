import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { AppNotificationService } from '../services/app-notification.service';
import { ChatService } from '../services/chat.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    sidebarOpen = signal(false);
    userName = '';
    userInitial = '';
    unreadCount = signal(0);

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService,
        private appNotificationService: AppNotificationService,
        private chatService: ChatService
    ) {
        const user = this.authService.getUser();
        if (user) {
            this.userName = user.name;
            this.userInitial = user.name.charAt(0).toUpperCase();
            
            // Join personal notification room
            this.chatService.joinUser(user.id);
            
            // Listen for real-time notifications
            this.chatService.onNewNotification().subscribe(() => {
                this.fetchNotifications();
            });
        }
        // Start global notification polling for the entire dashboard session
        this.notificationService.init();
    }

    ngOnInit(): void {
        this.fetchNotifications();
    }

    fetchNotifications(): void {
        this.appNotificationService.getNotifications().subscribe({
            next: (res) => {
                const count = res.notifications.filter(n => !n.is_read).length;
                this.unreadCount.set(count);
            },
            error: (err) => console.error('Error fetching notifications count:', err)
        });
    }

    toggleSidebar(): void {
        this.sidebarOpen.update(v => !v);
    }

    closeSidebar(): void {
        this.sidebarOpen.set(false);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
