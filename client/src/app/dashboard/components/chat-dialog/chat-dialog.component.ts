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
    @Input() otherUserId!: number;
    @Input() currentUserId!: number;
    @Input() currentUserName!: string;
    @Output() close = new EventEmitter<void>();
    @Output() openProfile = new EventEmitter<number>();

    messages: ChatMessage[] = [];
    newMessage = '';
    loading = true;
    otherUserTyping = false;
    private messageSubscription?: Subscription;
    private typingSubscription?: Subscription;
    private typingTimeout?: any;

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    ngOnInit(): void {
        this.loadInitialMessages();
        this.setupRealTimeUpdates();
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.typingSubscription?.unsubscribe();
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
                // Mark already fetched messages as read
                this.markMessagesAsRead();
            },
            error: (err) => {
                console.error('Error loading history:', err);
                this.loading = false;
            }
        });
    }

    setupRealTimeUpdates(): void {
        this.chatService.joinChat(this.requestId);

        this.messageSubscription = this.chatService.onNewMessage().subscribe((message) => {
            if (message.request_id === this.requestId) {
                if (!this.messages.some(m => m.id === message.id)) {
                    this.messages = [...this.messages, message];
                    this.scrollToBottom();
                    
                    // Mark as read immediately if chat is open
                    this.markMessagesAsRead();
                }
            }
        });

        // Listen for typing status
        this.typingSubscription = this.chatService.onTypingStatus().subscribe((data) => {
            if (data.requestId === this.requestId) {
                this.otherUserTyping = data.isTyping;
                if (data.isTyping) {
                    this.scrollToBottom();
                }
            }
        });
    }

    onTyping(): void {
        this.chatService.sendTypingStatus(this.requestId, this.currentUserName, true);
        
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.chatService.sendTypingStatus(this.requestId, this.currentUserName, false);
        }, 3000);
    }

    sendMessage(): void {
        if (!this.newMessage.trim()) return;

        const content = this.newMessage;
        this.newMessage = '';
        
        // Stop typing status immediately
        this.chatService.sendTypingStatus(this.requestId, '', false);
        if (this.typingTimeout) clearTimeout(this.typingTimeout);

        this.chatService.sendMessage(this.requestId, content).subscribe({
            next: (res) => {
                if (!res.success) {
                    console.error('Failed to send message:', res.message);
                }
            },
            error: (err) => {
                console.error('Error sending message:', err);
            }
        });
    }

    private markMessagesAsRead(): void {
        this.chatService.markAsRead(this.requestId).subscribe({
            error: (err) => console.error('Error marking as read:', err)
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

    onHeaderClick(): void {
        if (this.otherUserId) {
            this.openProfile.emit(this.otherUserId);
        }
    }
}
