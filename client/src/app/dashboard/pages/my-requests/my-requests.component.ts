import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, Request } from '../../../services/request.service';
import { ChatDialogComponent } from '../../components/chat-dialog/chat-dialog.component';
import { ProfileDialogComponent } from '../../components/profile-dialog/profile-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, ChatDialogComponent, ProfileDialogComponent],
    templateUrl: './my-requests.component.html',
    styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
    private requestService = inject(RequestService);
    private authService = inject(AuthService);
    private chatService = inject(ChatService);
    private cdr = inject(ChangeDetectorRef);

    requests: Request[] = [];
    loading = true;
    error: string | null = null;
    currentUserId = this.authService.getUser()?.id || 0;
    currentUserName = this.authService.getUser()?.name || 'User';
    private notificationSubscription?: Subscription;
    private messageSubscription?: Subscription;

    // Chat State
    chatOpen = false;
    selectedRequestId = 0;
    selectedTaskTitle = '';
    selectedUserName = '';
    selectedOtherUserId = 0;
    
    // Profile State
    profileOpen = false;
    selectedProfileUserId = 0;

    ngOnInit(): void {
        this.fetchMyRequests();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
        this.messageSubscription?.unsubscribe();
    }

    setupRealTimeUpdates(): void {
        this.notificationSubscription = this.chatService.onNewNotification().subscribe((notification) => {
            if (notification.type === 'request_accepted' || notification.type === 'request_rejected') {
                this.fetchMyRequests();
            }
        });

        // Listen for new messages to update unread badge in real-time
        this.messageSubscription = this.chatService.onNewMessage().subscribe((msg) => {
            if (!this.chatOpen || this.selectedRequestId !== msg.request_id) {
                const req = this.requests.find(r => r.id === msg.request_id);
                if (req && msg.sender_id !== this.currentUserId) {
                    req.unread_count = (req.unread_count || 0) + 1;
                    this.cdr.detectChanges();
                }
            }
        });
    }

    fetchMyRequests(): void {
        this.loading = true;
        this.error = null;

        this.requestService.getMyRequests().subscribe({
            next: (response) => {
                if (response && response.success) {
                    this.requests = response.requests || [];
                } else {
                    this.error = 'Failed to load your requests.';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching my requests', err);
                this.error = 'Failed to load your requests. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openChat(req: Request): void {
        if (!req.id) return;
        this.selectedRequestId = req.id;
        this.selectedTaskTitle = req.task_title || 'Task Details';
        this.selectedUserName = req.owner_name || 'Task Owner'; 
        this.selectedOtherUserId = req.owner_id || 0;
        this.chatOpen = true;
        req.unread_count = 0; // Clear locally
        this.cdr.detectChanges();
    }

    closeChat(): void {
        this.chatOpen = false;
        this.cdr.detectChanges();
    }

    openProfile(userId: number | undefined): void {
        if (!userId) return;
        this.selectedProfileUserId = userId;
        this.profileOpen = true;
        this.cdr.detectChanges();
    }

    closeProfile(): void {
        this.profileOpen = false;
        this.cdr.detectChanges();
    }
}
