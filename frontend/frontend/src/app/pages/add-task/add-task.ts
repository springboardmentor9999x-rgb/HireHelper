import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskPayload, TaskService } from '../../services/task.service';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css'],
})
export class AddTaskComponent {
  taskForm;
  loading = false;
  error = '';
  userName = 'User';
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
  ) {
    const user = this.auth.getStoredUser();
    this.userName = user?.first_name || 'User';
    this.userEmail = user?.email_id || '';

    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
      location: ['', [Validators.required, Validators.maxLength(255)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      urgency: ['MEDIUM', [Validators.required]],
      tools_required: [false],
      vehicle_required: [false],
      contact_method: ['WhatsApp', [Validators.required, Validators.maxLength(50)]],
      budget: [null, [Validators.required, Validators.min(1)]],
      helpers_needed: [1, [Validators.required, Validators.min(1)]],
      duration_hours: [1, [Validators.required, Validators.min(0.5)]],
      special_instructions: ['', [Validators.maxLength(1000)]],
      start_time: ['', [Validators.required]],
      end_time: [''],
      picture: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  onDateSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    
    // Aggressive picker close
    target.blur();
    document.body.click();
    
    // Validate
    const start = this.taskForm.get('start_time')?.value;
    const end = this.taskForm.get('end_time')?.value;
    if (end && start && new Date(end) < new Date(start)) {
      this.error = 'End time cannot be before start time';
    } else {
      this.error = '';
    }
  }



@HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close any open date pickers by blurring active element if it's a date input
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement && 
        (activeElement.type === 'datetime-local' || activeElement.type === 'date')) {
      activeElement.blur();
    }
  }




  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get f() {
    return this.taskForm.controls;
  }

  addTask(): void {
    this.error = '';

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.error = 'Please fill all required fields correctly';
      return;
    }

    const startTime = this.taskForm.value.start_time ?? '';
    const endTime = this.taskForm.value.end_time ?? '';
    if (endTime && new Date(endTime) < new Date(startTime)) {
      this.error = 'End time cannot be before start time';
      return;
    }

    const payload: TaskPayload = {
      title: (this.taskForm.value.title ?? '').trim(),
      description: (this.taskForm.value.description ?? '').trim(),
      location: (this.taskForm.value.location ?? '').trim(),
      category: (this.taskForm.value.category ?? '').trim(),
      urgency: ((this.taskForm.value.urgency ?? 'MEDIUM').toString().toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'),
      tools_required: !!this.taskForm.value.tools_required,
      vehicle_required: !!this.taskForm.value.vehicle_required,
      contact_method: (this.taskForm.value.contact_method ?? 'WhatsApp').toString().trim(),
      budget: Number(this.taskForm.value.budget),
      helpers_needed: Number(this.taskForm.value.helpers_needed),
      duration_hours: Number(this.taskForm.value.duration_hours),
      special_instructions: (this.taskForm.value.special_instructions ?? '').trim() || null,
      start_time: startTime,
      end_time: endTime || null,
      picture: (this.taskForm.value.picture ?? '').trim(),
    };

    this.loading = true;
    this.taskService.addTask(payload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Task created successfully',
          confirmButtonColor: '#8a4b7c',
        });
        this.taskService.savePendingTask(response.task);
        this.router.navigate(['/my-tasks'], {
          state: { createdTask: response.task },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create task';
      },
    });
  }
}
