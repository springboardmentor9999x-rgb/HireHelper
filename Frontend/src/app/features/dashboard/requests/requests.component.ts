import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests: any[] = [];
  isLoading = true;
  errorMsg = '';
  apiUrl = environment.apiUrl;
  replyMessage: string = '';

  taskGroups: any[] = [];
  selectedTaskGroup: any = null;
  labels: any = {};
  selectedChat: any = null;
  sidePanelOpen: boolean = false;
  chatReplyMessage: string = '';
  currentUserId: string = '';
  private pollingInterval: any;

  constructor(
    private taskService: TaskService,
    private langService: LanguageService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUserId = JSON.parse(userStr).id;
      } catch (e) {}
    }

    this.langService.lang$.subscribe(() => {
      this.labels = this.langService.getLabels();
    });
    this.fetchRequests(true);

    this.pollingInterval = setInterval(() => {
      this.fetchRequests(false);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fetchRequests(showLoading = false): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.taskService.getIncomingRequests().subscribe({
      next: (data) => {
        const groupsMap = new Map();
        
        data.forEach((req: any) => {
          let conversation = [];
          if (req.reply_message) {
            try {
              conversation = JSON.parse(req.reply_message);
            } catch (e) {
              conversation = [{ sender: 'System', text: req.reply_message }];
            }
          }
          const requestObj = { ...req, conversation };
          
          if (!groupsMap.has(req.task_id)) {
            groupsMap.set(req.task_id, {
              task_id: req.task_id,
              title: req.title,
              description: req.description,
              location: req.location,
              pay: req.pay,
              task_image: req.picture,
              requests: [],
              hasAccepted: false
            });
          }
          const group = groupsMap.get(req.task_id);
          group.requests.push(requestObj);
          if (req.request_status === 'accepted') {
            group.hasAccepted = true;
          }
        });

        this.taskGroups = Array.from(groupsMap.values());
        this.requests = data; // Keep raw data if needed

        // If a panel is currently open, refresh its data
        if (this.selectedTaskGroup) {
          const updatedGroup = this.taskGroups.find(g => g.task_id === this.selectedTaskGroup.task_id);
          this.selectedTaskGroup = updatedGroup || null;
          if (!this.selectedTaskGroup) {
            this.sidePanelOpen = false;
            this.selectedChat = null;
          } else if (this.selectedChat) {
             const updatedChat = this.selectedTaskGroup.requests.find((r: any) => r.request_id === this.selectedChat.request_id);
             this.selectedChat = updatedChat || null;
             if (this.selectedChat) {
                this.taskService.markMessagesAsRead(this.selectedChat.request_id).subscribe();
             }
          }
        }

        if (showLoading) {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMsg = 'Failed to load help offers.';
        this.isLoading = false;
      }
    });
  }

  acceptRequest(requestId: string): void {
    this.taskService.updateRequestStatus(requestId, 'accepted').subscribe({
      next: () => this.fetchRequests(),
      error: (err) => this.modalService.show('Error', err?.error?.msg || 'Failed to accept request.', 'error')
    });
  }

  rejectRequest(requestId: string): void {
    this.taskService.updateRequestStatus(requestId, 'rejected').subscribe({
      next: () => this.fetchRequests(),
      error: (err) => this.modalService.show('Error', err?.error?.msg || 'Failed to reject request.', 'error')
    });
  }

  sendChatReply(requestId: string): void {
    if (!this.chatReplyMessage.trim()) return;

    this.taskService.replyToRequest(requestId, this.chatReplyMessage).subscribe({
      next: () => {
        this.chatReplyMessage = '';
        this.fetchRequests(); // Automatically load the new conversation thread
      },
      error: (err: any) => {
        this.modalService.show('Error', err?.error?.msg || 'Failed to send reply', 'error');
      }
    });
  }

  openSidePanel(group: any): void {
    this.selectedTaskGroup = group;
    this.selectedChat = null;
    this.sidePanelOpen = true;
  }

  openChat(req: any): void {
    this.selectedChat = req;
    this.chatReplyMessage = '';
    this.taskService.markMessagesAsRead(req.request_id).subscribe();
  }

  closeChat(): void {
    this.selectedChat = null;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    setTimeout(() => {
      this.selectedTaskGroup = null;
      this.selectedChat = null;
    }, 300);
  }
}
