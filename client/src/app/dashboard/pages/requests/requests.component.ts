import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, Request } from '../../../services/request.service';
import { ChatDialogComponent } from '../../components/chat-dialog/chat-dialog.component';
import { ProfileDialogComponent } from '../../components/profile-dialog/profile-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-requests',
    standalone: true,
    imports: [CommonModule, ChatDialogComponent, ProfileDialogComponent],
    templateUrl: './requests.component.html',
    styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit, OnDestroy {
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
        this.fetchIncomingRequests();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
        this.messageSubscription?.unsubscribe();
    }

    setupRealTimeUpdates(): void {
        this.notificationSubscription = this.chatService.onNewNotification().subscribe((notification) => {
            // Only refetch if the notification is about a new request
            if (notification.type === 'request_received') {
                this.fetchIncomingRequests();
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

    fetchIncomingRequests(): void {
        this.loading = true;
        this.error = null;

        this.requestService.getIncomingRequests().subscribe({
            next: (response) => {
                if (response && response.success) {
                    this.requests = response.requests || [];
                } else {
                    this.error = 'Failed to load requests.';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching incoming requests', err);
                this.error = 'Failed to load requests. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onUpdateStatus(requestId: number | undefined, status: string): void {
        if (!requestId) return;

        this.requestService.updateRequestStatus(requestId, status).subscribe({
            next: (response) => {
                if (response.success) {
                    const req = this.requests.find(r => r.id === requestId);
                    if (req) req.status = status;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Error updating status', err)
        });
    }

    openChat(req: Request): void {
        if (!req.id) return;
        this.selectedRequestId = req.id;
        this.selectedTaskTitle = req.task_title || 'Task Details';
        this.selectedUserName = req.user_name || 'User';
        this.selectedOtherUserId = req.user_id || 0;
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

    getGroupedRequests() {
        const groups: { [key: string]: Request[] } = {};
        this.requests.forEach(req => {
            const title = req.task_title || 'Untitled Task';
            if (!groups[title]) groups[title] = [];
            groups[title].push(req);
        });
        return Object.entries(groups).map(([title, items]) => ({ title, items }));
    }
}
