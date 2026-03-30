import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, RequestItem } from '../../services/request.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit, OnDestroy {
  requests: RequestItem[] = [];
  loading = true;
  errorMessage = '';
  private refreshSubscription?: Subscription;

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
        this.errorMessage = 'Failed to load your requests. Please try again.';
        console.error('Error fetching my requests:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
