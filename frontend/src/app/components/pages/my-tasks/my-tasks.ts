import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  image?: string;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Task categories
  taskCategories = [
    'Cleaning',
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Painting',
    'Appliance Repair',
    'HVAC & AC Service',
    'Home Maintenance',
    'Gardening',
    'Moving & Relocation',
    'Pest Control',
    'Personal Assistance',
    'IT & Tech Support',
    'Delivery Services',
    'Other'
  ];

  // Edit modal state
  showEditModal = false;
  editingTask: Task | null = null;
  editForm: FormGroup;
  submitting = false;
  selectedImage: File | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      location: ['', Validators.required],
      budget: [''],
      start_time: ['', Validators.required],
      end_time: ['']
    });
  }

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

  // Edit task - open modal with task data
  editTask(taskId: number) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      this.editingTask = task;
      this.editForm.patchValue({
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        budget: task.budget || '',
        start_time: task.start_time,
        end_time: task.end_time
      });
      this.selectedImage = null;
      this.showEditModal = true;
    }
  }

  // Save edited task
  saveTask() {
    if (!this.editingTask) return;
    
    if (this.editForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.submitting = true;
    const taskId = this.editingTask.id;
    const apiUrl = `${environment.apiUrl}/tasks/${taskId}`;

    // Create FormData for multipart upload
    const formData = new FormData();
    
    formData.append('title', this.editForm.value.title);
    formData.append('description', this.editForm.value.description);
    formData.append('category', this.editForm.value.category);
    formData.append('location', this.editForm.value.location);
    
    if (this.editForm.value.budget) {
      formData.append('budget', parseFloat(this.editForm.value.budget).toString());
    }
    if (this.editForm.value.start_time) {
      formData.append('start_time', this.editForm.value.start_time);
    }
    if (this.editForm.value.end_time) {
      formData.append('end_time', this.editForm.value.end_time);
    }
    
    // Add image only if new image selected
    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    this.http.put<any>(apiUrl, formData).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.successMessage = '✅ Task updated successfully!';
          this.showEditModal = false;
          this.editingTask = null;
          this.loadTasks();
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error updating task:', error);
        this.errorMessage = error.error?.message || 'Failed to update task';
      }
    });
  }

  // Cancel edit
  cancelEdit() {
    this.showEditModal = false;
    this.editingTask = null;
    this.selectedImage = null;
    this.editForm.reset();
  }

  // Handle image selection
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      console.log('Image selected:', file.name);
    }
  }

  // Delete task
  deleteTask(taskId: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.loading = true;
    const apiUrl = `${environment.apiUrl}/tasks/${taskId}`;

    this.http.delete<any>(apiUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = '✅ Task deleted successfully!';
          this.tasks = this.tasks.filter(t => t.id !== taskId);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting task:', error);
        this.errorMessage = error.error?.message || 'Failed to delete task';
      }
    });
  }

  addNewTask() {
    this.router.navigate(['/dashboard/add-task']);
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
    const colors: { [key: string]: string } = {
      'design': '#FF6B6B',
      'development': '#4ECDC4',
      'writing': '#45B7D1',
      'marketing': '#FFA07A',
      'other': '#95E1D3'
    };
    return colors[category.toLowerCase()] || '#95E1D3';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    
    return 'Invalid input';
  }
}
