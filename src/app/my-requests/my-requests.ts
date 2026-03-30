import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-requests.html',
  styleUrls: ['./my-requests.css']
})
export class MyRequestsComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  message = '';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests() {
    this.loading = true;
    this.message = '';

    this.auth.getMyRequests().subscribe({
      next: (res: any) => {
        console.log('MY REQUESTS RESPONSE:', res);
        this.requests = Array.isArray(res) ? res : [];
        this.loading = false;

        if (this.requests.length === 0) {
          this.message = 'No requests found';
        }
      },
      error: (err) => {
        console.error('MY REQUESTS ERROR:', err);
        this.loading = false;
        this.message = err?.error?.message || 'Error loading requests';
      }
    });
  }
}