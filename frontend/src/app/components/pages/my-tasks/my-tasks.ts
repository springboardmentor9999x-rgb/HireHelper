import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  start_time?: string;
  end_time?: string;
  budget?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

interface MyTasksResponse {
  success: boolean;
  message: string;
  data: Task[];
  count: number;
}

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css'],
  standalone: true,
  imports: [CommonModule],
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const apiUrl = `${environment.apiUrl}/tasks/my-tasks`;

    this.http.get<MyTasksResponse>(apiUrl).subscribe({
      next: (response: MyTasksResponse) => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data;
          this.successMessage = `Loaded ${response.count} task(s)`;
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

  deleteTask(taskId: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.loading = true;
    const apiUrl = `${environment.apiUrl}/tasks/${taskId}`;

    this.http.delete<{ success: boolean; message: string }>(apiUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
          this.successMessage = 'Task deleted successfully';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to delete task';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error deleting task:', error);
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to delete this task.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to delete task. Please try again.';
        }
      },
    });
  }

  editTask(taskId: number) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      this.errorMessage = 'Task not found';
      return;
    }

    // Show edit prompt with task details
    const newTitle = prompt('Edit Title:', task.title);
    if (newTitle === null) return; // User cancelled

    const newDescription = prompt('Edit Description:', task.description);
    if (newDescription === null) return; // User cancelled

    if (!newTitle.trim() || !newDescription.trim()) {
      this.errorMessage = 'Title and description are required';
      return;
    }

    this.loading = true;
    const apiUrl = `${environment.apiUrl}/tasks/${taskId}`;
    const updateData = {
      title: newTitle.trim(),
      description: newDescription.trim(),
    };

    this.http.put<{ success: boolean; message: string }>(apiUrl, updateData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const index = this.tasks.findIndex(t => t.id === taskId);
          if (index > -1) {
            this.tasks[index].title = newTitle.trim();
            this.tasks[index].description = newDescription.trim();
          }
          this.successMessage = 'Task updated successfully';
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to update task';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error updating task:', error);
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to update this task.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to update task. Please try again.';
        }
      },
    });
  }

  addNewTask() {
    this.router.navigate(['/dashboard/add-task']);
  }
}
