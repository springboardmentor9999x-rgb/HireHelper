import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskItem, TaskPayload, TaskService } from '../../services/task.service';
import { timeout } from 'rxjs';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css']
})
export class MyTasksComponent implements OnInit {
  tasks: TaskItem[] = [];
  loading = true;
  error = '';
  private createdTaskFromState: TaskItem | null = null;

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createdTaskFromState =
      (history.state?.createdTask as TaskItem | undefined) ??
      this.taskService.getPendingTask();
    this.loadTasks();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getMyTasks()
      .pipe(
        timeout(10000)
      )
      .subscribe({
      next: (tasks) => {
        console.log('[MyTasks] received tasks:', tasks);
        this.loading = false;

        if (this.createdTaskFromState && !tasks.some((task) => task.id === this.createdTaskFromState?.id)) {
          this.tasks = [this.createdTaskFromState, ...tasks];
          this.cdr.detectChanges();
          return;
        }

        this.tasks = [...tasks];
        if (this.createdTaskFromState && tasks.some((task) => task.id === this.createdTaskFromState?.id)) {
          this.taskService.clearPendingTask();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('[MyTasks] request failed:', err);
        if (this.createdTaskFromState) {
          this.tasks = [this.createdTaskFromState];
        }

        this.error = err.name === 'TimeoutError'
          ? 'Task list request timed out. Check that the backend is running and then refresh.'
          : err.error?.message || 'Failed to load tasks';
        this.cdr.detectChanges();
      }
    });
  }

  editTask(task: TaskItem): void {
    Swal.fire({
      title: 'Edit Task Details',
      html: `
        <div class="task-edit-form">
          <label class="task-edit-field full">
            <span>Title</span>
            <input id="edit-title" type="text" placeholder="Enter task title" value="${this.escapeHtml(task.title)}">
          </label>

          <label class="task-edit-field full">
            <span>Description</span>
            <textarea id="edit-description" placeholder="Describe the task">${this.escapeHtml(task.description)}</textarea>
          </label>

          <label class="task-edit-field">
            <span>Location</span>
            <input id="edit-location" type="text" placeholder="Task location" value="${this.escapeHtml(task.location)}">
          </label>

          <label class="task-edit-field">
            <span>Category</span>
            <input id="edit-category" type="text" placeholder="Cleaning" value="${this.escapeHtml(task.category || '')}">
          </label>

          <label class="task-edit-field">
            <span>Urgency</span>
            <select id="edit-urgency">
              <option value="LOW" ${task.urgency === 'LOW' ? 'selected' : ''}>Low</option>
              <option value="MEDIUM" ${(task.urgency || 'MEDIUM') === 'MEDIUM' ? 'selected' : ''}>Medium</option>
              <option value="HIGH" ${task.urgency === 'HIGH' ? 'selected' : ''}>High</option>
            </select>
          </label>

          <label class="task-edit-field">
            <span>Budget (INR)</span>
            <input id="edit-budget" type="number" min="1" value="${task.budget ?? ''}">
          </label>

          <label class="task-edit-field">
            <span>Helpers Needed</span>
            <input id="edit-helpers-needed" type="number" min="1" value="${task.helpers_needed ?? ''}">
          </label>

          <label class="task-edit-field">
            <span>Duration (hours)</span>
            <input id="edit-duration-hours" type="number" min="0.5" step="0.5" value="${task.duration_hours ?? ''}">
          </label>

          <label class="task-edit-field">
            <span>Tools Required</span>
            <select id="edit-tools-required">
              <option value="false" ${task.tools_required ? '' : 'selected'}>No</option>
              <option value="true" ${task.tools_required ? 'selected' : ''}>Yes</option>
            </select>
          </label>

          <label class="task-edit-field">
            <span>Vehicle Required</span>
            <select id="edit-vehicle-required">
              <option value="false" ${task.vehicle_required ? '' : 'selected'}>No</option>
              <option value="true" ${task.vehicle_required ? 'selected' : ''}>Yes</option>
            </select>
          </label>

          <label class="task-edit-field">
            <span>Picture URL</span>
            <input id="edit-picture" type="url" placeholder="https://example.com/image.jpg" value="${this.escapeHtml(task.picture || '')}">
          </label>

          <label class="task-edit-field">
            <span>Contact Method</span>
            <select id="edit-contact-method">
              <option value="WhatsApp" ${(task.contact_method || 'WhatsApp') === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
              <option value="Call" ${task.contact_method === 'Call' ? 'selected' : ''}>Call</option>
              <option value="Phone" ${task.contact_method === 'Phone' ? 'selected' : ''}>Phone</option>
            </select>
          </label>

          <label class="task-edit-field">
            <span>Start Time</span>
            <input id="edit-start" type="datetime-local" value="${this.toLocalDatetime(task.start_time)}">
          </label>

          <label class="task-edit-field">
            <span>End Time (Optional)</span>
            <input id="edit-end" type="datetime-local" value="${task.end_time ? this.toLocalDatetime(task.end_time) : ''}">
          </label>

          <label class="task-edit-field full">
            <span>Special Instructions</span>
            <textarea id="edit-special-instructions" placeholder="Any special notes">${this.escapeHtml(task.special_instructions || '')}</textarea>
          </label>
        </div>
      `,
      customClass: {
        popup: 'task-edit-popup',
        title: 'task-edit-title',
        htmlContainer: 'task-edit-html',
        confirmButton: 'task-edit-confirm',
        cancelButton: 'task-edit-cancel'
      },
      width: '760px',
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const title = (document.getElementById('edit-title') as HTMLInputElement)?.value?.trim();
        const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value?.trim();
        const location = (document.getElementById('edit-location') as HTMLInputElement)?.value?.trim();
        const category = (document.getElementById('edit-category') as HTMLInputElement)?.value?.trim();
        const urgency = ((document.getElementById('edit-urgency') as HTMLSelectElement)?.value || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
        const budget = Number((document.getElementById('edit-budget') as HTMLInputElement)?.value);
        const helpers_needed = Number((document.getElementById('edit-helpers-needed') as HTMLInputElement)?.value);
        const duration_hours = Number((document.getElementById('edit-duration-hours') as HTMLInputElement)?.value);
        const tools_required = ((document.getElementById('edit-tools-required') as HTMLSelectElement)?.value || 'false') === 'true';
        const vehicle_required = ((document.getElementById('edit-vehicle-required') as HTMLSelectElement)?.value || 'false') === 'true';
        const start_time = (document.getElementById('edit-start') as HTMLInputElement)?.value;
        const end_time = (document.getElementById('edit-end') as HTMLInputElement)?.value;
        const picture = (document.getElementById('edit-picture') as HTMLInputElement)?.value?.trim();
        const contact_method = (document.getElementById('edit-contact-method') as HTMLSelectElement)?.value?.trim() || 'WhatsApp';
        const special_instructions = (document.getElementById('edit-special-instructions') as HTMLTextAreaElement)?.value?.trim() || null;

        if (!title || !description || !location || !category || !contact_method || !start_time || !picture) {
          Swal.showValidationMessage(
            'Please fill all required fields: Title, Description, Location, Category, Contact Method, Start Time, and Picture URL.'
          );
          return false;
        }

        if (!Number.isFinite(budget) || budget <= 0) {
          Swal.showValidationMessage('Budget must be a positive number.');
          return false;
        }

        if (!Number.isInteger(helpers_needed) || helpers_needed <= 0) {
          Swal.showValidationMessage('Helpers needed must be a positive whole number.');
          return false;
        }

        if (!Number.isFinite(duration_hours) || duration_hours <= 0) {
          Swal.showValidationMessage('Duration must be a positive number of hours.');
          return false;
        }

        if (end_time && new Date(end_time) < new Date(start_time)) {
          Swal.showValidationMessage('End time must be after start time.');
          return false;
        }

        return {
          title,
          description,
          location,
          category,
          urgency,
          tools_required,
          vehicle_required,
          contact_method,
          budget,
          helpers_needed,
          duration_hours,
          special_instructions,
          start_time,
          end_time: end_time || null,
          picture
        } as TaskPayload;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.taskService.updateTask(task.id, result.value).subscribe({
          next: (response) => {
            this.tasks = this.tasks.map(t => t.id === task.id ? response.task : t);
            this.cdr.detectChanges();
            Swal.fire({
              icon: 'success',
              title: 'Task Updated',
              text: `Task "${response.task.title}" saved successfully.`,
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff'
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: err.error?.message || 'Failed to update task',
              confirmButtonColor: '#ef4444'
            });
          }
        });
      }
    });
  }

  closeTask(task: TaskItem): void {
    this.error = '';

    Swal.fire({
      title: 'Close task?',
      text: 'This will mark the task as closed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Close task',
      confirmButtonColor: '#f97316'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.taskService.closeTask(task.id).subscribe({
        next: (response) => {
          this.tasks = this.tasks.map((item) =>
            item.id === task.id ? response.task : item
          );
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'success',
            title: 'Closed',
            text: response.message,
            confirmButtonColor: '#f97316'
          });
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to close task';
          this.cdr.detectChanges();
        }
      });
    });
  }

  deleteTask(task: TaskItem): void {
    this.error = '';

    Swal.fire({
      title: 'Delete task?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.taskService.deleteTask(task.id).subscribe({
        next: (response) => {
          this.tasks = this.tasks.filter((item) => item.id !== task.id);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: response.message,
            confirmButtonColor: '#ef4444'
          });
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete task';
          this.cdr.detectChanges();
        }
      });
    });
  }

  reopenTask(task: TaskItem): void {
    this.error = '';

    Swal.fire({
      title: 'Reopen task?',
      text: 'This will make the task available again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Reopen',
      confirmButtonColor: '#22c55e'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.taskService.reopenTask(task.id).subscribe({
        next: (response) => {
          this.tasks = this.tasks.map((item) =>
            item.id === task.id ? response.task : item
          );
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'success',
            title: 'Reopened',
            text: response.message,
            confirmButtonColor: '#22c55e'
          });
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to reopen task';
          this.cdr.detectChanges();
        }
      });
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toLocalDatetime(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

