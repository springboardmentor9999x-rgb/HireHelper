import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface TaskResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class AddTaskComponent implements OnInit {
  taskForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedImage: File | null = null;

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.taskForm = this.fb.group({
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
    // Initialize form
  }

  get f() {
    return this.taskForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    
    return 'Invalid input';
  }

  onCancel() {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/dashboard/my-tasks']);
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Form valid:', this.taskForm.valid);
    console.log('Title valid:', this.taskForm.get('title')?.valid);
    console.log('Description valid:', this.taskForm.get('description')?.valid);
    console.log('Category valid:', this.taskForm.get('category')?.valid);
    console.log('Location valid:', this.taskForm.get('location')?.valid);
    console.log('Form value:', this.taskForm.value);

    // Check required fields (title, description, category, location, start_time)
    if (!this.taskForm.get('title')?.valid || 
        !this.taskForm.get('description')?.valid ||
        !this.taskForm.get('category')?.valid ||
        !this.taskForm.get('location')?.valid ||
        !this.taskForm.get('start_time')?.valid) {
      console.error('Form validation failed');
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    
    // Get form values
    const formData = this.taskForm.value;
    
    // Create FormData for multipart upload
    const formDataToSend = new FormData();
    
    // Add form fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('location', formData.location);
    
    if (formData.budget) {
      formDataToSend.append('budget', parseFloat(formData.budget).toString());
    }
    if (formData.start_time) {
      formDataToSend.append('start_time', formData.start_time);
    }
    if (formData.end_time) {
      formDataToSend.append('end_time', formData.end_time);
    }
    
    // Add image file if selected
    if (this.selectedImage) {
      formDataToSend.append('image', this.selectedImage, this.selectedImage.name);
      console.log('📸 Image attached:', this.selectedImage.name);
    }

    const apiUrl = `${environment.apiUrl}/tasks`;

    console.log('📤 API URL:', apiUrl);
    console.log('📤 Submitting task data with image');

    this.http.post<TaskResponse>(apiUrl, formDataToSend).subscribe({
      next: (response: TaskResponse) => {
        this.loading = false;
        console.log('✅ Task creation response:', response);
        if (response.success) {
          this.successMessage = '✅ ' + (response.message || 'Task created successfully!');
          this.taskForm.reset({
            status: 'open',
          });
          this.submitted = false;
          this.selectedImage = null;
          // Redirect to my-tasks after 2.5 seconds to ensure task is saved
          setTimeout(() => {
            console.log('Redirecting to my-tasks...');
            this.router.navigate(['/dashboard/my-tasks']);
          }, 2500);
        } else {
          this.errorMessage = response.message || 'Failed to create task';
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('❌ Error creating task:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid task data. Please check your input.';
        } else if (error.status === 0) {
          this.errorMessage = 'Connection error. Please check your internet and try again.';
        } else if (error.status === 500) {
          const dbError = error.error?.error || error.error?.message || 'Server error';
          const code = error.error?.code ? ` (${error.error.code})` : '';
          this.errorMessage = `Failed to create task: ${dbError}${code}`;
          console.error('🔍 Server error details:', error.error);
        } else {
          this.errorMessage = error.error?.message || `Failed to create task (Status: ${error.status}). Please try again.`;
        }
      },
    });
  }

  resetForm() {
    this.taskForm.reset({
      status: undefined,
    });
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedImage = null;
  }

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (validTypes.includes(file.type)) {
        // Validate file size (max 5MB)
        if (file.size <= 5 * 1024 * 1024) {
          this.selectedImage = file;
          console.log('✅ Image selected:', file.name, 'Size:', file.size);
        } else {
          this.errorMessage = 'Image size must be less than 5MB';
          this.selectedImage = null;
        }
      } else {
        this.errorMessage = 'Please select a valid image file (JPG, PNG, GIF, WebP)';
        this.selectedImage = null;
      }
    }
  }
}