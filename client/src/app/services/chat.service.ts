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
    private apiUrl = '/api/chat';
    private socket: Socket;
    private messageSubject = new Subject<ChatMessage>();

    constructor() {
        // Initialize socket connection
        this.socket = io('http://localhost:5000', {
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

    joinChat(requestId: number) {
        this.socket.emit('join_chat', requestId);
    }

    joinUser(userId: number) {
        this.socket.emit('join_user', userId);
    }

    onNewMessage(): Observable<ChatMessage> {
        return this.messageSubject.asObservable();
    }

    onNewNotification(): Observable<any> {
        return this.notificationSubject.asObservable();
    }
}
