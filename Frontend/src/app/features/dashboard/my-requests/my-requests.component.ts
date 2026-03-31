import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
  appliedTasks: any[] = [];
  isLoading = true;
  errorMsg = '';
  apiUrl = environment.apiUrl;
  labels: any = {};
    replyingRequestId: string | null = null;
    replyMessage: string = '';

    selectedRequest: any = null;
    sidePanelOpen: boolean = false;
    currentUserId: string = '';
    private pollingInterval: any;

  // Custom Confirm Modal State
  isConfirmModalOpen = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalAction: (() => void) | null = null;
  confirmModalButtonText = 'Confirm';
  confirmModalButtonClass = 'btn-danger';

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
    this.fetchAppliedTasks(true);

    this.pollingInterval = setInterval(() => {
      this.fetchAppliedTasks(false);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fetchAppliedTasks(showLoading = false): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.taskService.getMyAppliedTasks().subscribe({
      next: (data) => {
        this.appliedTasks = data.map((task: any) => {
          let conversation = [];
          if (task.reply_message) {
            try {
              conversation = JSON.parse(task.reply_message);
            } catch (e) {
              conversation = [{ sender: 'System', text: task.reply_message }];
            }
          }
          return { ...task, conversation };
        });

        // Update selected request if panel is open
        if (this.selectedRequest) {
          const updatedReq = this.appliedTasks.find(t => t.request_id === this.selectedRequest.request_id);
          this.selectedRequest = updatedReq || null;
          if (!this.selectedRequest) {
            this.sidePanelOpen = false;
          } else {
             this.taskService.markMessagesAsRead(this.selectedRequest.request_id).subscribe();
          }
        }

        if (showLoading) {
           this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMsg = 'Failed to load applied tasks.';
        this.isLoading = false;
      }
    });
  }

  openReplyModal(requestId: string): void {
    this.replyingRequestId = requestId;
    this.replyMessage = '';
  }

  cancelReply(): void {
    this.replyingRequestId = null;
    this.replyMessage = '';
  }

  sendReply(): void {
    if (!this.replyMessage.trim() || !this.selectedRequest) return;

    this.taskService.replyToRequest(this.selectedRequest.request_id, this.replyMessage).subscribe({
      next: (res) => {
        this.replyMessage = '';
        this.fetchAppliedTasks(); // Refresh to see the updated conversation
      },
      error: (err: any) => {
        this.modalService.show('Error', err?.error?.msg || 'Failed to send reply', 'error');
      }
    });
  }

  deleteRequest(requestId: string): void {
    this.openConfirmModal('Delete Request', 'Are you sure you want to delete this request?', 'Delete', 'btn-primary', () => {
      this.taskService.deleteRequest(requestId).subscribe({
        next: () => {
          this.modalService.show('Success', 'Request deleted successfully', 'success');
          this.closeSidePanel();
          this.fetchAppliedTasks();
        },
        error: (err: any) => {
           this.modalService.show('Error', err?.error?.msg || 'Failed to delete request', 'error');
        }
      });
    });
  }

  openSidePanel(req: any): void {
    this.selectedRequest = req;
    this.sidePanelOpen = true;
    this.taskService.markMessagesAsRead(req.request_id).subscribe();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    setTimeout(() => this.selectedRequest = null, 300); // delay clear for animation
  }

  // Modal Handlers
  openConfirmModal(title: string, message: string, buttonText: string, buttonClass: string, action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalButtonText = buttonText;
    this.confirmModalButtonClass = buttonClass;
    this.confirmModalAction = action;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal() {
    this.isConfirmModalOpen = false;
    this.confirmModalAction = null;
  }

  executeConfirmModal() {
    if (this.confirmModalAction) {
      this.confirmModalAction();
    }
    this.closeConfirmModal();
  }
}
