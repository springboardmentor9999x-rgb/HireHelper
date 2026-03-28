import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css']
})
export class AddTask {
  private readonly employerStatsStorageKey = 'employerDashboardStats';

  taskData = {
    title: '',
    description: '',
    location: '',
    city: '',
    start_time: '',
    end_time: '',
    status: 'open'  // Default to 'open' so helpers can apply
  };

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isSubmitting: boolean = false;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private toast: ToastService
  ) {}

  onImageSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning('Image size should not exceed 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toast.warning('Please select a valid image file');
        return;
      }

      this.selectedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  formatPreviewDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return labels[status] || 'Open';
  }

  createTask() {
    this.isSubmitting = true;

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('title', this.taskData.title);
    formData.append('description', this.taskData.description);
    formData.append('location', this.taskData.location);
    formData.append('city', this.taskData.city);
    formData.append('start_time', this.taskData.start_time);
    formData.append('status', this.taskData.status);  // Add status

    if (this.taskData.end_time) {
      formData.append('end_time', this.taskData.end_time);
    }

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.taskService.createTask(formData).subscribe(
      (res: any) => {
        this.isSubmitting = false;
        this.incrementEmployerStatsCache();
        this.toast.success('Task created successfully');
        this.router.navigate(['/my-tasks']);
      },
      (error) => {
        this.isSubmitting = false;
        console.error('Error creating task:', error);
        this.toast.error('Failed to create task. Please try again.');
      }
    );
  }

  private incrementEmployerStatsCache() {
    const defaultStats = {
      activeTasks: 0,
      totalHelpers: 0,
      pendingRequests: 0,
      completedTasks: 0,
    };

    try {
      const rawStats = localStorage.getItem(this.employerStatsStorageKey);
      const stats = rawStats ? { ...defaultStats, ...JSON.parse(rawStats) } : defaultStats;

      if (this.taskData.status === 'completed') {
        stats.completedTasks += 1;
      } else {
        stats.activeTasks += 1;
      }

      localStorage.setItem(this.employerStatsStorageKey, JSON.stringify(stats));
    } catch {
      localStorage.setItem(
        this.employerStatsStorageKey,
        JSON.stringify({
          activeTasks: this.taskData.status === 'completed' ? 0 : 1,
          totalHelpers: 0,
          pendingRequests: 0,
          completedTasks: this.taskData.status === 'completed' ? 1 : 0,
        })
      );
    }
  }
}
