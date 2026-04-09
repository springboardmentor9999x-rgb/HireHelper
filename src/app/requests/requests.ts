import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css']
})
export class RequestsComponent implements OnInit {
  requests: any[] = [];
  loading = true;
  message = '';
  actionLoadingId: number | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  goBack(): void {
    window.history.back();
  }

  loadRequests(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.loading = false;
      this.message = 'Please login first';
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.loading = true;
    this.message = '';
    this.requests = [];

    this.http.get<any>('http://localhost:5000/api/requests/incoming', { headers }).subscribe({
      next: (res) => {
        console.log('Incoming requests response:', res);

        this.requests = res?.requests || res || [];
        this.loading = false;

        if (this.requests.length === 0) {
          this.message = 'No incoming requests available';
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Incoming requests error:', err);
        this.loading = false;
        this.message = err?.error?.message || 'Error loading requests';
        this.cdr.detectChanges();
      }
    });
  }

  updateRequest(requestId: number, status: 'ACCEPTED' | 'REJECTED'): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.actionLoadingId = requestId;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.put<any>(
      `http://localhost:5000/api/requests/${requestId}`,
      { status },
      { headers }
    ).subscribe({
      next: (res) => {
        alert(res?.message || `Request ${status.toLowerCase()} successfully`);

        this.requests = this.requests.map((req) =>
          req.id === requestId ? { ...req, status } : req
        );

        this.actionLoadingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update request error:', err);
        alert(err?.error?.message || 'Failed to update request');
        this.actionLoadingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(req: any): string {
    const first = req.first_name?.charAt(0)?.toUpperCase() || '';
    const last = req.last_name?.charAt(0)?.toUpperCase() || '';
    const initials = `${first}${last}`.trim();

    if (initials) return initials;
    if (req.email) return req.email.charAt(0).toUpperCase();
    return 'U';
  }

  getFullName(req: any): string {
    const name = `${req.first_name || ''} ${req.last_name || ''}`.trim();
    if (name) return name;
    if (req.email) return req.email.split('@')[0];
    return 'User';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();

    if (s === 'PENDING') return 'pending';
    if (s === 'ACCEPTED') return 'accepted';
    if (s === 'REJECTED') return 'rejected';

    return 'default';
  }
}