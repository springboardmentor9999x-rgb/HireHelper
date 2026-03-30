import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class RequestsComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  goBack(): void {
    window.history.back();
  }

  loadRequests(): void {
    this.loading = true;
    this.authService.getReceivedRequests().subscribe({
      next: (res) => {
        this.requests = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message || 'Failed to load requests';
        this.loading = false;
      }
    });
  }

  updateStatus(requestId: number, status: 'ACCEPTED' | 'REJECTED'): void {
    this.authService.updateRequestStatus(requestId, status).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadRequests();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to update request');
      }
    });
  }
}