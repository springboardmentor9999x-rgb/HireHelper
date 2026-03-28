import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../services/request';
import { ToastService } from '../../services/toast';
import { ReviewService } from '../../services/review';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent],
  templateUrl: './my-requests.html',
  styleUrl: './my-requests.css',
})
export class MyRequests implements OnInit {
  private requestService = inject(RequestService);
  private toast = inject(ToastService);
  private reviewService = inject(ReviewService);

  requests: any[] = [];
  
  showReviewModal = false;
  reviewTaskOriginal: any = null;
  reviewData = { rating: 5, comment: '' };
  filteredRequests: any[] = [];

  loading = false;
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'latest';
  editingRequestId: number | null = null;
  editMessage = '';
  savingEdit = false;
  pendingDeleteRequestId: number | null = null;
  pendingDeleteTimeoutHandle: number | null = null;

  // Profile Modal State
  isProfileModalOpen = false;
  profileUserId: number | null = null;
  profileUserName = '';
  profileUserRating: number | string | null = null;

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests() {
    this.loading = true;
    this.requestService.getMyRequests().subscribe(
      (res: any) => {
        this.requests = Array.isArray(res) ? res : [];
        this.filterRequests();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading my requests:', error);
        this.requests = [];
        this.filteredRequests = [];
        this.loading = false;
      }
    );
  }

  filterRequests() {
    let filtered = [...this.requests];

    if (this.selectedStatus) {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.task_title || '').toLowerCase().includes(query) ||
        (item.task_location || '').toLowerCase().includes(query) ||
        (item.message || '').toLowerCase().includes(query) ||
        (item.hirer_reply || '').toLowerCase().includes(query)
      );
    }

    this.filteredRequests = filtered;
    this.sortRequests();
  }

  sortRequests() {
    switch (this.sortBy) {
      case 'oldest':
        this.filteredRequests.sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        break;
      case 'task':
        this.filteredRequests.sort((a, b) =>
          (a.task_title || '').localeCompare(b.task_title || '')
        );
        break;
      default:
        this.filteredRequests.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterRequests();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      COMPLETED: 'Completed'
    };
    return labels[status] || 'Unknown';
  }

  formatDate(value: string): string {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(value: string): string {
    if (!value) return '';
    const now = new Date().getTime();
    const then = new Date(value).getTime();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return this.formatDate(value);
  }

  startEdit(item: any): void {
    if (item?.status !== 'PENDING') {
      return;
    }

    this.editingRequestId = item.id;
    this.editMessage = item.message || '';
  }

  cancelEdit(): void {
    this.editingRequestId = null;
    this.editMessage = '';
    this.savingEdit = false;
  }

  saveEdit(item: any): void {
    if (!item?.id || this.savingEdit) {
      return;
    }

    this.savingEdit = true;
    this.requestService.updateMyRequest(item.id, this.editMessage).subscribe(
      (res: any) => {
        item.message = res?.request?.message ?? this.editMessage;
        item.updated_at = res?.request?.updated_at ?? item.updated_at;
        this.cancelEdit();
        this.toast.success('Request message updated. Hirer has been notified.');
      },
      (error) => {
        this.savingEdit = false;
        const msg = error?.error?.error || 'Failed to update request message.';
        this.toast.error(msg);
      }
    );
  }

  deleteRequest(item: any): void {
    if (!item?.id) {
      return;
    }

    if (item.status !== 'PENDING') {
      this.toast.warning('Only pending requests can be deleted.');
      return;
    }

    if (this.pendingDeleteRequestId !== item.id) {
      this.pendingDeleteRequestId = item.id;
      this.toast.warning('Click Delete Request again within 5 seconds to confirm.');

      if (this.pendingDeleteTimeoutHandle !== null) {
        window.clearTimeout(this.pendingDeleteTimeoutHandle);
      }

      this.pendingDeleteTimeoutHandle = window.setTimeout(() => {
        this.pendingDeleteRequestId = null;
        this.pendingDeleteTimeoutHandle = null;
      }, 5000);
      return;
    }

    this.pendingDeleteRequestId = null;
    if (this.pendingDeleteTimeoutHandle !== null) {
      window.clearTimeout(this.pendingDeleteTimeoutHandle);
      this.pendingDeleteTimeoutHandle = null;
    }

    this.requestService.deleteMyRequest(item.id).subscribe(
      () => {
        this.requests = this.requests.filter(req => req.id !== item.id);
        this.filterRequests();

        if (this.editingRequestId === item.id) {
          this.cancelEdit();
        }

        this.toast.success('Request deleted successfully.');
      },
      (error) => {
        const msg = error?.error?.error || 'Failed to delete request.';
        this.toast.error(msg);
      }
    );
  }

  openReviewModal(item: any) {
    this.reviewTaskOriginal = item;
    this.reviewData = { rating: 5, comment: '' };
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.reviewTaskOriginal = null;
  }

  submitReview() {
    if (!this.reviewTaskOriginal) return;

    const taskId = this.reviewTaskOriginal.task || this.reviewTaskOriginal.task_id;
    
    this.reviewService.submitReview(taskId, this.reviewData.rating, this.reviewData.comment).subscribe({
      next: () => {
        this.toast.success("Review submitted successfully!");
        this.closeReviewModal();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.error || "Failed to submit review");
      }
    });
  }

  openProfileModal(userId: number, userName: string, rating: number | string | null = null) {
    if (!userId) return;
    this.profileUserId = userId;
    this.profileUserName = userName;
    this.profileUserRating = rating;
    this.isProfileModalOpen = true;
  }
}
