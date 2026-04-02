import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, RequestItem } from '../../services/request.service';
import { NotificationService } from '../../services/notification.service';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
  requests: RequestItem[] = [];
  loading = true;
  private refreshSubscription?: Subscription;

  // Review modal state
  reviewingRequest: RequestItem | null = null;
  reviewForm = { rating: 5, comment: '' };
  isReviewing = false;
  reviewedTaskIds = new Set<number>();

  private toastService = inject(ToastService);
  private reviewService = inject(ReviewService);

  constructor(
    private requestService: RequestService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchMyRequests();

    // Listen for refresh triggers (e.g., from new notifications)
    this.refreshSubscription = this.notificationService.refresh$.subscribe(() => {
      this.fetchMyRequests();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  fetchMyRequests(): void {
    this.loading = true;
    this.requestService.getMyRequests().subscribe({
      next: (res) => {
        this.requests = res.requests || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toastService.showError('Failed to load your requests. Please try again.');
        console.error('Error fetching my requests:', err);
        this.cdr.detectChanges();
      }
    });
  }

  cancelRequest(requestId: number): void {
    if (!confirm('Are you sure you want to withdraw this request?')) return;
    this.requestService.cancelRequest(requestId).subscribe({
      next: () => {
        this.toastService.showSuccess('Request withdrawn successfully.');
        this.fetchMyRequests();
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Failed to withdraw request.')
    });
  }

  openReviewModal(request: RequestItem): void {
    this.reviewingRequest = request;
    this.reviewForm = { rating: 5, comment: '' };
  }

  closeReviewModal(): void {
    this.reviewingRequest = null;
    this.isReviewing = false;
  }

  submitReview(): void {
    if (!this.reviewingRequest?.id || !this.reviewingRequest.owner_id) {
      this.toastService.showError('Cannot submit review: Owner information missing.');
      return;
    }
    this.isReviewing = true;
    
    const reviewData = {
      task_id: this.reviewingRequest.task_id,
      reviewee_id: this.reviewingRequest.owner_id,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: () => {
        this.toastService.showSuccess('Review submitted! Thank you.');
        this.reviewedTaskIds.add(this.reviewingRequest!.task_id as number);
        this.closeReviewModal();
        this.fetchMyRequests();
      },
      error: (err) => {
        this.isReviewing = false;
        this.toastService.showError(err.error?.message || 'Failed to submit review.');
      }
    });
  }

  getTaskProgress(status: string | undefined): number {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 0;
      case 'ASSIGNED': return 1;
      case 'COMPLETED': return 2;
      case 'VERIFIED': return 3;
      default: return 0;
    }
  }
}
