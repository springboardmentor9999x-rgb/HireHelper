import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class FeedComponent implements OnInit {
  tasks: any[] = [];
  loading = true;
  message = '';
  requestLoadingId: number | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadFeed();
  }

  goBack(): void {
    window.history.back();
  }

  loadFeed(): void {
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
    this.tasks = [];

    this.http.get<any>('http://localhost:5000/api/tasks', { headers }).subscribe({
      next: (res) => {
        console.log('Feed response:', res);

        this.tasks = res?.tasks || [];

        this.loading = false;

        if (this.tasks.length === 0) {
          this.message = 'No tasks available';
        } else {
          this.message = '';
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Feed error:', err);
        this.loading = false;
        this.message = 'Error loading feed';
        this.cdr.detectChanges();
      }
    });
  }

  sendRequest(taskId: number): void {
  const selectedTask = this.tasks.find(task => task.id === taskId);

  if (!selectedTask || selectedTask.request_sent || selectedTask.status === 'ASSIGNED') {
    return;
  }

  this.requestLoadingId = taskId;
  this.cdr.detectChanges();

  this.authService.requestTask(taskId).subscribe({
    next: (res) => {
      alert(res.message || 'Request sent successfully');

      this.tasks = this.tasks.map(task =>
        task.id === taskId
          ? { ...task, request_sent: true }
          : task
      );

      this.requestLoadingId = null;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Request send error:', err);

      if (err.error?.message?.toLowerCase().includes('already')) {
        this.tasks = this.tasks.map(task =>
          task.id === taskId
            ? { ...task, request_sent: true }
            : task
        );
      }

      alert(err.error?.message || 'Failed to send request');
      this.requestLoadingId = null;
      this.cdr.detectChanges();
    }
  });
}

  getInitials(task: any): string {
    const first = task.first_name?.charAt(0)?.toUpperCase() || '';
    const last = task.last_name?.charAt(0)?.toUpperCase() || '';
    const initials = `${first}${last}`.trim();

    return initials || 'U';
  }

  getFullName(task: any): string {
    const fullName = `${task.first_name || ''} ${task.last_name || ''}`.trim();
    return fullName || 'Unknown User';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();

    if (s === 'OPEN') return 'open';
    if (s === 'ASSIGNED') return 'assigned';
    if (s === 'PENDING') return 'pending';

    return 'default';
  }
}