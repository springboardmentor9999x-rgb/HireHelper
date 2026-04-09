import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { AppNotificationService } from '../services/app-notification.service';
import { ChatService } from '../services/chat.service';
import { ThemeService } from '../services/theme.service';

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
    userPicture: string | null = null;
    unreadCount = signal(0);

    constructor(
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService,
        private appNotificationService: AppNotificationService,
        private chatService: ChatService,
        public themeService: ThemeService
    ) {
        const user = this.authService.getUser() as any;
        if (user) {
            this.userName = user.name;
            this.userInitial = user.name.charAt(0).toUpperCase();
            this.userPicture = user.picture_url && user.picture_url.startsWith('http') 
                ? user.picture_url 
                : (user.picture_url ? `http://localhost:5000${user.picture_url}` : null);
            
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

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
