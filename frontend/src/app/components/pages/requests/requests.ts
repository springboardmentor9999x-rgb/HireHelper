import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestService, ReceivedRequest } from '../../../services/request.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.html',
  styleUrls: ['./requests.css'],
  standalone: true,
  imports: [CommonModule],
})
export class RequestsComponent implements OnInit {
  requests: ReceivedRequest[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestIds: Set<string> = new Set();

  constructor(
    private requestService: RequestService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadReceivedRequests();
  }

  loadReceivedRequests() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.requestService.getReceivedRequests().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.requests = response.data;
          this.successMessage = `Loaded ${response.count} request(s)`;
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to load requests';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading requests:', error);
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load requests. Please try again.';
        }
      },
    });
  }

  acceptRequest(requestId: string, requesterName: string) {
    if (!confirm(`Accept request from ${requesterName}?`)) {
      return;
    }

    this.processingRequestIds.add(requestId);

    this.requestService.acceptRequest(requestId).subscribe({
      next: (response) => {
        this.processingRequestIds.delete(requestId);
        if (response.success) {
          this.successMessage = response.message || 'Request accepted successfully';
          this.loadReceivedRequests();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to accept request';
        }
      },
      error: (error) => {
        this.processingRequestIds.delete(requestId);
        console.error('Error accepting request:', error);
        this.errorMessage = error.error?.message || 'Failed to accept request. Try again.';
      },
    });
  }

  rejectRequest(requestId: string, requesterName: string) {
    if (!confirm(`Reject request from ${requesterName}?`)) {
      return;
    }

    this.processingRequestIds.add(requestId);

    this.requestService.rejectRequest(requestId).subscribe({
      next: (response) => {
        this.processingRequestIds.delete(requestId);
        if (response.success) {
          this.successMessage = response.message || 'Request rejected successfully';
          this.loadReceivedRequests();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to reject request';
        }
      },
      error: (error) => {
        this.processingRequestIds.delete(requestId);
        console.error('Error rejecting request:', error);
        this.errorMessage = error.error?.message || 'Failed to reject request. Try again.';
      },
    });
  }

  isProcessing(requestId: string): boolean {
    return this.processingRequestIds.has(requestId);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'ACCEPTED': 'status-accepted',
      'REJECTED': 'status-rejected',
    };
    return statusMap[status] || 'status-pending';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getRequesterName(request: ReceivedRequest): string {
    const firstName = request.requester_first_name || '';
    const lastName = request.requester_last_name || '';
    return `${firstName} ${lastName}`.trim() || request.requester_email;
  }

  refresh() {
    this.loadReceivedRequests();
  }

  closeTask(taskId: string) {
    if (!confirm('Are you sure you want to close this task?')) {
      return;
    }

    const apiUrl = `${environment.apiUrl}/tasks/${taskId}/close`;

    this.http.patch<{ success: boolean; message: string }>(apiUrl, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Task closed successfully! ✓ It will appear in the feed as closed.';
          this.loadReceivedRequests();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to close task';
        }
      },
      error: (error) => {
        console.error('Error closing task:', error);
        if (error.status === 403) {
          this.errorMessage = 'You do not have permission to close this task.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to close task. Please try again.';
        }
      },
    });
  }

  isTaskClosed(taskId: string): boolean {
    const request = this.requests.find(r => r.task_id === taskId);
    return request?.task_status?.toLowerCase() === 'closed';
  }
}
