import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, RequestItem } from '../../services/request.service';
import { ToastService } from '../../services/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit {
  requests: RequestItem[] = [];
  loading = true;
  errorMessage = '';
  private toastService = inject(ToastService);

  constructor(
    private requestService: RequestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchReceivedRequests();
  }

  fetchReceivedRequests(): void {
    this.loading = true;
    this.requestService.getReceivedRequests().subscribe({
      next: (res) => {
        this.requests = res.requests || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to load received requests. Please try again.';
        console.error('Error fetching received requests:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onUpdateStatus(requestId: number, status: 'ACCEPTED' | 'REJECTED'): void {
    this.requestService.updateRequestStatus(requestId, status).subscribe({
      next: () => {
        this.toastService.showSuccess(`Request ${status.toLowerCase()} successfully!`);
        // Refresh the list after successful update
        this.fetchReceivedRequests();
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || `Failed to ${status.toLowerCase()} request. Please try again.`);
        this.errorMessage = `Failed to ${status.toLowerCase()} request. Please try again.`;
        console.error(`Error updating request to ${status}:`, err);
        this.cdr.detectChanges();
      }
    });
  }
}
