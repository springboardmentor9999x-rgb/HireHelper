import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-dialog.component.html',
    styleUrls: ['./chat-dialog.component.css']
})
export class ChatDialogComponent implements OnInit, OnDestroy, AfterViewChecked {
    private chatService = inject(ChatService);

    @Input() requestId!: number;
    @Input() taskTitle!: string;
    @Input() otherUserName!: string;
    @Input() currentUserId!: number;
    @Output() close = new EventEmitter<void>();

    messages: ChatMessage[] = [];
    newMessage = '';
    loading = true;
    private messageSubscription?: Subscription;

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    ngOnInit(): void {
        this.loadInitialMessages();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    loadInitialMessages(): void {
        this.chatService.getMessages(this.requestId).subscribe({
            next: (res) => {
                if (res.success) {
                    this.messages = res.messages;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading history:', err);
                this.loading = false;
            }
        });
    }

    setupRealTimeUpdates(): void {
        // Join the specific chat room
        this.chatService.joinChat(this.requestId);

        // Listen for new messages
        this.messageSubscription = this.chatService.onNewMessage().subscribe((message) => {
            if (message.request_id === this.requestId) {
                // Avoid duplicating if we sent it ourselves and refreshed (though we won't refresh anymore)
                if (!this.messages.some(m => m.id === message.id)) {
                    this.messages = [...this.messages, message];
                    this.scrollToBottom();
                }
            }
        });
    }

    sendMessage(): void {
        if (!this.newMessage.trim()) return;

        const content = this.newMessage;
        this.newMessage = '';

        this.chatService.sendMessage(this.requestId, content).subscribe({
            next: (res) => {
                // No need to refresh messages here, the socket event will handle it
                if (!res.success) {
                    console.error('Failed to send message:', res.message);
                }
            },
            error: (err) => {
                console.error('Error sending message:', err);
            }
        });
    }

    private scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch(err) { }
    }

    onClose(): void {
        this.close.emit();
    }
}
