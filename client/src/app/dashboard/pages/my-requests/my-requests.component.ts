import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, Request } from '../../../services/request.service';
import { ChatDialogComponent } from '../../components/chat-dialog/chat-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, ChatDialogComponent],
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
    private notificationSubscription?: Subscription;

    // Chat State
    chatOpen = false;
    selectedRequestId = 0;
    selectedTaskTitle = '';
    selectedUserName = '';

    ngOnInit(): void {
        this.fetchMyRequests();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
    }

    setupRealTimeUpdates(): void {
        this.notificationSubscription = this.chatService.onNewNotification().subscribe((notification) => {
            // Refetch if my request was accepted or rejected
            if (notification.type === 'request_accepted' || notification.type === 'request_rejected') {
                this.fetchMyRequests();
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
        // For helper, the "other user" is whoever owns the task.
        // The Request object might not have the owner's name directly, but I can improve the backend API or just use a placeholder.
        // Wait, Request findByUserId joins with tasks. I should check if Request object has task user name.
        this.selectedUserName = 'Task Owner'; 
        this.chatOpen = true;
        this.cdr.detectChanges();
    }

    closeChat(): void {
        this.chatOpen = false;
        this.cdr.detectChanges();
    }
}
