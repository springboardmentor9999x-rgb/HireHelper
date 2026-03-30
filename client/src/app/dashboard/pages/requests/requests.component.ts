import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, Request } from '../../../services/request.service';
import { ChatDialogComponent } from '../../components/chat-dialog/chat-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-requests',
    standalone: true,
    imports: [CommonModule, ChatDialogComponent],
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
    private notificationSubscription?: Subscription;

    // Chat State
    chatOpen = false;
    selectedRequestId = 0;
    selectedTaskTitle = '';
    selectedUserName = '';

    ngOnInit(): void {
        this.fetchIncomingRequests();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
    }

    setupRealTimeUpdates(): void {
        this.notificationSubscription = this.chatService.onNewNotification().subscribe((notification) => {
            // Only refetch if the notification is about a new request
            if (notification.type === 'request_received') {
                this.fetchIncomingRequests();
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
        this.chatOpen = true;
        this.cdr.detectChanges();
    }

    closeChat(): void {
        this.chatOpen = false;
        this.cdr.detectChanges();
    }
}
