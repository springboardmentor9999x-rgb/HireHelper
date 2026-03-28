import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task';
import { ToastService } from '../../services/toast';
import { ReviewService } from '../../services/review';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css']
})

export class MyTasks implements OnInit {
  tasks: any[] = [];
  filteredTasks: any[] = [];

  loading = false;
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'latest';
  completingTaskIds: Set<number> = new Set();
  confirmDeleteTaskId: number | null = null;

  showEditModal = false;
  editTaskData: any = {};
  editTaskOriginal: any = null;
  editImageFile: File | null = null;
  editImagePreview: string | null = null;

  showReviewModal = false;
  reviewTaskOriginal: any = null;
  reviewData = { rating: 5, comment: '' };

  constructor(private taskService: TaskService, private toast: ToastService, private reviewService: ReviewService) {}

  ngOnInit() {
    this.loadMyTasks();
  }

  loadMyTasks() {
    this.loading = true;
    this.taskService.getMyTasks().subscribe(
      (res: any) => {
        this.tasks = Array.isArray(res) ? res : [];
        this.filterTasks();
        setTimeout(() => { this.loading = false; }, 0);
      },
      (error) => {
        console.error('Error loading my tasks:', error);
        this.tasks = [];
        this.filteredTasks = [];
        setTimeout(() => { this.loading = false; }, 0);
      }
    );
  }

  filterTasks() {
    // shallow copy not strictly needed since filter() returns a new array anyway, 
    // but useful if we drop the filter blocks later.
    let filtered = this.tasks;

    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        (task.title || '').toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        (task.city || '').toLowerCase().includes(q)
      );
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    switch (this.sortBy) {
      case 'oldest':
        this.filteredTasks.sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        break;
      case 'title':
        this.filteredTasks.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        this.filteredTasks.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterTasks();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed'
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
      minute: '2-digit'
    });
  }

  getTimeAgo(value: string): string {
    if (!value) return '';
    const now = new Date().getTime();
    const then = new Date(value).getTime();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    // fallback to full date format for anything older than a week
    return this.formatDate(value);
  }

  canMarkCompleted(task: any): boolean {
    return task?.status === 'in_progress';
  }

  markTaskCompleted(task: any): void {
    if (!task?.id || this.completingTaskIds.has(task.id)) {
      return;
    }

    if (!this.canMarkCompleted(task)) {
      this.toast.warning('Only in-progress tasks can be marked completed.');
      return;
    }

    this.completingTaskIds.add(task.id);

    this.taskService.completeTask(task.id).subscribe(
      () => {
        task.status = 'completed';
        this.filterTasks();
        this.toast.success(`Task "${task.title}" marked as completed.`);
        this.completingTaskIds.delete(task.id);
      },
      (error) => {
        const msg = error?.error?.error || 'Failed to mark task as completed.';
        this.toast.error(msg);
        this.completingTaskIds.delete(task.id);
      }
    );
  }

    editTask(task: any): void {
      this.editTaskOriginal = task;
      this.editTaskData = { ...task };
      this.editImageFile = null;
      this.editImagePreview = task.image || null;
      this.showEditModal = true;
    }

    onEditImageSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          this.toast.warning('Image size should not exceed 5MB');
          return;
        }
        if (!file.type.startsWith('image/')) {
          this.toast.warning('Please select a valid image file');
          return;
        }
        this.editImageFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.editImagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }

    removeEditImage() {
      this.editImageFile = null;
      this.editImagePreview = null;
      this.editTaskData.image = null;
    }

    saveEditTask(): void {
      if (!this.editTaskOriginal || !this.editTaskData.title) return;
      
      let data: any;
      // if image was changed or explicitly removed, we must use FormData to send multipart/form-data
      if (this.editImageFile || this.editImagePreview === null) {
        data = new FormData();
        data.append('title', this.editTaskData.title);
        data.append('description', this.editTaskData.description);
        data.append('city', this.editTaskData.city);
        data.append('location', this.editTaskData.location);
        data.append('start_time', this.editTaskData.start_time);
        data.append('status', this.editTaskData.status);
        if (this.editTaskData.end_time) data.append('end_time', this.editTaskData.end_time);
        if (this.editImageFile) {
          data.append('image', this.editImageFile);
        } else if (this.editImagePreview === null) {
          data.append('image', ''); // backend interprets empty string or null as a delete signal
        }
      } else {
        // no file changes, just send raw JSON payload
        data = { ...this.editTaskData };
      }
      this.taskService.updateTask(this.editTaskOriginal.id, data).subscribe(
        (updatedTask: any) => {
          Object.assign(this.editTaskOriginal, updatedTask);
          this.toast.success('Task updated successfully.');
          this.filterTasks();
          this.showEditModal = false;
          this.editTaskOriginal = null;
          this.editTaskData = {};
          this.editImageFile = null;
          this.editImagePreview = null;
        },
        (error) => {
          const msg = error?.error?.error || 'Failed to update task.';
          this.toast.error(msg);
        }
      );
    }

    cancelEditTask(): void {
      this.showEditModal = false;
      this.editTaskOriginal = null;
      this.editTaskData = {};
      this.editImageFile = null;
      this.editImagePreview = null;
    }

    askDeleteTask(task: any): void {
      this.confirmDeleteTaskId = task.id;
    }

    cancelDeleteTask(): void {
      this.confirmDeleteTaskId = null;
    }

    confirmDeleteTask(task: any): void {
      this.taskService.deleteTask(task.id).subscribe(
        () => {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.filterTasks();
          this.toast.success('Task deleted successfully.');
          this.confirmDeleteTaskId = null;
        },
        (error) => {
          const msg = error?.error?.error || 'Failed to delete task.';
          this.toast.error(msg);
          this.confirmDeleteTaskId = null;
        }
      );
    }

    openReviewModal(task: any) {
      this.reviewTaskOriginal = task;
      this.reviewData = { rating: 5, comment: '' };
      this.showReviewModal = true;
    }

    closeReviewModal() {
      this.showReviewModal = false;
      this.reviewTaskOriginal = null;
    }

    submitReview() {
      if (!this.reviewTaskOriginal) return;
      this.reviewService.submitReview(this.reviewTaskOriginal.id, this.reviewData.rating, this.reviewData.comment).subscribe({
        next: () => {
          this.toast.success("Review submitted successfully!");
          this.closeReviewModal();
        },
        error: (err: any) => {
          this.toast.error(err?.error?.error || "Failed to submit review");
        }
      });
    }
}
