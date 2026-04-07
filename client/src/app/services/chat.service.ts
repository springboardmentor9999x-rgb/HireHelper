import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
    id: number;
    request_id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private http = inject(HttpClient);
    private apiUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.hostname}:5000/api/chat`
        : 'http://localhost:5000/api/chat';
        
    private socket: Socket;
    private messageSubject = new Subject<ChatMessage>();
    private typingSubject = new BehaviorSubject<{ requestId: number; userName: string; isTyping: boolean }>({ requestId: 0, userName: '', isTyping: false });
    private messagesReadSubject = new Subject<{ requestId: number; userId: number }>();

    constructor() {
        // Initialize socket connection using the same host as the API but port 5000
        const socketUrl = typeof window !== 'undefined' 
            ? `${window.location.protocol}//${window.location.hostname}:5000`
            : 'http://localhost:5000';
            
        this.socket = io(socketUrl, {
            withCredentials: true,
            autoConnect: true
        });

        // Listen for new messages globally
        this.socket.on('new_message', (message: ChatMessage) => {
            this.messageSubject.next(message);
        });

        // Listen for new notifications
        this.socket.on('new_notification', (notification: any) => {
            this.notificationSubject.next(notification);
        });

        // Listen for typing status
        this.socket.on('user_typing', (data: any) => {
            this.typingSubject.next(data);
        });

        // Listen for read status
        this.socket.on('messages_read', (data: any) => {
            this.messagesReadSubject.next(data);
        });

        this.socket.on('connect', () => console.log('🛡️ Chat Socket connected'));
        this.socket.on('disconnect', () => console.log('🚨 Chat Socket disconnected'));
    }

    private notificationSubject = new Subject<any>();

    sendMessage(requestId: number, content: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/send`, { request_id: requestId, content });
    }

    getMessages(requestId: number): Observable<{ success: boolean; messages: ChatMessage[] }> {
        return this.http.get<{ success: boolean; messages: ChatMessage[] }>(`${this.apiUrl}/${requestId}`);
    }

    markAsRead(requestId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${requestId}/read`, {});
    }

    joinChat(requestId: number) {
        this.socket.emit('join_chat', requestId);
    }

    joinUser(userId: number) {
        this.socket.emit('join_user', userId);
    }

    sendTypingStatus(requestId: number, userName: string, isTyping: boolean) {
        if (isTyping) {
            this.socket.emit('typing_start', { requestId, userName });
        } else {
            this.socket.emit('typing_stop', { requestId });
        }
    }

    onNewMessage(): Observable<ChatMessage> {
        return this.messageSubject.asObservable();
    }

    onNewNotification(): Observable<any> {
        return this.notificationSubject.asObservable();
    }

    onTypingStatus(): Observable<any> {
        return this.typingSubject.asObservable();
    }

    onMessagesRead(): Observable<any> {
        return this.messagesReadSubject.asObservable();
    }
}
