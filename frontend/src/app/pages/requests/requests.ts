import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../services/request';
import { ToastService } from '../../services/toast';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
})
export class Requests implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];

  loading = false;
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'latest';
  replyingRequestId: number | null = null;
  replyDraftByRequestId: Record<number, string> = {};
  savingReply = false;

  // Profile Modal State
  isProfileModalOpen = false;
  profileUserId: number | null = null;
  profileUserName = '';
  profileUserRating: number | string | null = null;

  constructor(private requestService: RequestService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadIncomingRequests();
  }

  loadIncomingRequests() {
    this.loading = true;
    this.requestService.getIncomingRequests().subscribe(
      (res: any) => {
        this.requests = Array.isArray(res) ? res : [];
        this.filterRequests();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading incoming requests:', error);
        this.requests = [];
        this.filteredRequests = [];
        this.loading = false;
      }
    );
  }

  filterRequests() {
    let filtered = [...this.requests];

    if (this.selectedStatus) {
      filtered = filtered.filter((item) => item.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.task_title || '').toLowerCase().includes(q) ||
        (item.requester_name || '').toLowerCase().includes(q) ||
        (item.task_location || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q) ||
        (item.hirer_reply || '').toLowerCase().includes(q)
      );
    }

    this.filteredRequests = filtered;
    this.sortRequests();
  }

  sortRequests() {
    switch (this.sortBy) {
      case 'oldest':
        this.filteredRequests.sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        );
        break;
      case 'task':
        this.filteredRequests.sort((a, b) =>
          (a.task_title || '').localeCompare(b.task_title || '')
        );
        break;
      default:
        this.filteredRequests.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterRequests();
  }

  acceptRequest(item: any) {
    if (!item?.id) return;

    // Optimistic update
    const previousStatus = item.status;
    item.status = 'ACCEPTED';
    this.filterRequests();

    this.requestService.acceptRequest(item.id).subscribe(
      () => {
        this.toast.success('Request accepted. Helper has been notified.');
      },
      (error) => {
        // Revert on error
        item.status = previousStatus;
        this.filterRequests();
        console.error('Error accepting request:', error);
        this.toast.error('Failed to accept request.');
      }
    );
  }

  rejectRequest(item: any) {
    if (!item?.id) return;

    // Optimistic update
    const previousStatus = item.status;
    item.status = 'REJECTED';
    this.filterRequests();

    this.requestService.rejectRequest(item.id).subscribe(
      () => {
        this.toast.info('Request rejected. Helper has been notified.');
      },
      (error) => {
        // Revert on error
        item.status = previousStatus;
        this.filterRequests();
        console.error('Error rejecting request:', error);
        this.toast.error('Failed to reject request.');
      }
    );
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      COMPLETED: 'Completed',
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
      minute: '2-digit',
    });
  }

  getTimeAgo(value: string): string {
    if (!value) return '';
    const now = Date.now();
    const then = new Date(value).getTime();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return this.formatDate(value);
  }

  startReply(item: any): void {
    if (!item?.id) {
      return;
    }

    this.replyingRequestId = item.id;
    this.replyDraftByRequestId[item.id] = item.hirer_reply || '';
  }

  cancelReply(): void {
    this.replyingRequestId = null;
    this.savingReply = false;
  }

  saveReply(item: any): void {
    if (!item?.id || this.savingReply) {
      return;
    }

    this.savingReply = true;
    const replyText = (this.replyDraftByRequestId[item.id] || '').trim();

    this.requestService.replyToRequest(item.id, replyText).subscribe(
      (res: any) => {
        item.hirer_reply = res?.request?.hirer_reply ?? replyText;
        this.cancelReply();
        this.toast.success('Reply sent to helper.');
      },
      (error) => {
        this.savingReply = false;
        const msg = error?.error?.error || 'Failed to send reply.';
        this.toast.error(msg);
      }
    );
  }

  openProfileModal(userId: number, userName: string, rating: number | string | null = null) {
    if (!userId) return;
    this.profileUserId = userId;
    this.profileUserName = userName;
    this.profileUserRating = rating;
    this.isProfileModalOpen = true;
  }
}
