import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, MyRequest } from '../../../services/request.service';

@Component({
  selector: 'app-my-requests',
  templateUrl: './my-requests.html',
  styleUrls: ['./my-requests.css'],
  standalone: true,
  imports: [CommonModule],
})
export class MyRequestsComponent implements OnInit {
  requests: MyRequest[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  cancellingRequestIds: Set<string> = new Set();

  constructor(private requestService: RequestService) {}

  ngOnInit() {
    this.loadMyRequests();
  }

  loadMyRequests() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.requestService.getMyRequests().subscribe({
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

  cancelRequest(requestId: string, taskTitle: string) {
    if (!confirm(`Cancel request for "${taskTitle}"?`)) {
      return;
    }

    this.cancellingRequestIds.add(requestId);

    this.requestService.cancelRequest(requestId).subscribe({
      next: (response) => {
        this.cancellingRequestIds.delete(requestId);
        if (response.success) {
          this.successMessage = response.message || 'Request cancelled successfully';
          this.loadMyRequests();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to cancel request';
        }
      },
      error: (error) => {
        this.cancellingRequestIds.delete(requestId);
        console.error('Error cancelling request:', error);
        this.errorMessage = error.error?.message || 'Failed to cancel request. Try again.';
      },
    });
  }

  isCancelling(requestId: string): boolean {
    return this.cancellingRequestIds.has(requestId);
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

  refresh() {
    this.loadMyRequests();
  }
}
