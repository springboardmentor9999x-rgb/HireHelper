import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RequestService } from '../../../services/request.service';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  start_time?: string;
  end_time?: string;
  budget?: number;
  location?: string;
  owner_email?: string;
  is_requested?: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedResponse {
  success: boolean;
  message: string;
  data: Task[];
  count: number;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
  standalone: true,
  imports: [CommonModule],
})
export class FeedComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  requestingTaskIds: Set<string> = new Set();

  constructor(
    private http: HttpClient,
    private requestService: RequestService
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const apiUrl = `${environment.apiUrl}/tasks/feed`;

    this.http.get<FeedResponse>(apiUrl).subscribe({
      next: (response: FeedResponse) => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data;
          this.successMessage = `Loaded ${response.count} tasks`;
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to load tasks';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading tasks:', error);
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view this content.';
        } else if (error.status === 0) {
          this.errorMessage = 'Connection error. Please check your internet and try again.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load tasks. Please try again.';
        }
      },
    });
  }

  sendRequest(taskId: string) {
    this.requestingTaskIds.add(taskId);
    
    this.requestService.sendRequest(taskId).subscribe({
      next: (response) => {
        this.requestingTaskIds.delete(taskId);
        if (response.success) {
          // Update task status in the list
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            task.is_requested = true;
          }
          
          this.successMessage = response.message || 'Request sent successfully!';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to send request';
        }
      },
      error: (error) => {
        this.requestingTaskIds.delete(taskId);
        console.error('Error sending request:', error);
        
        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Cannot send request';
        } else if (error.status === 401) {
          this.errorMessage = 'Please login to send requests';
        } else {
          this.errorMessage = 'Failed to send request. Try again.';
        }
      }
    });
  }

  isRequestingSending(taskId: string): boolean {
    return this.requestingTaskIds.has(taskId);
  }

  refreshTasks() {
    this.loadTasks();
  }

  getCategoryColor(category: string): string {
    const categoryColors: { [key: string]: string } = {
      development: '#3B82F6',
      design: '#8B5CF6',
      writing: '#EC4899',
      marketing: '#F59E0B',
      consulting: '#10B981',
      other: '#6B7280',
    };
    return categoryColors[category?.toLowerCase()] || '#6B7280';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatBudget(budget: number | undefined): string {
    if (!budget) return 'Negotiable';
    return `$${budget.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  truncateText(text: string, length: number = 80): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

}

