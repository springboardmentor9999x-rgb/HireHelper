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
      title: '✏️ Edit Task Details',
      icon: 'info',
      html: `
        <div style="text-align: left;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #000000;">📝 Title</label>
          <input id="edit-title" class="swal2-input" placeholder="Enter task title" value="${this.escapeHtml(task.title)}" style="border-radius: 12px; padding: 12px; color: #000000;">
          
          <label style="display: block; margin: 16px 0 8px 0; font-weight: bold; color: #000000;">📄 Description</label>
          <textarea id="edit-description" class="swal2-textarea" placeholder="Describe the task" style="border-radius: 12px; padding: 12px; height: 100px; color: #000000;">${this.escapeHtml(task.description)}</textarea>
          
          <label style="display: block; margin: 16px 0 8px 0; font-weight: bold; color: #000000;">📍 Location</label>
          <input id="edit-location" class="swal2-input" placeholder="Task location" value="${this.escapeHtml(task.location)}" style="border-radius: 12px; padding: 12px; color: #000000;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #000000;">🕒 Start Time</label>
              <input id="edit-start" class="swal2-input" type="datetime-local" value="${this.toLocalDatetime(task.start_time)}" style="border-radius: 12px; padding: 12px; color: #000000;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #000000;">⏰ End Time (Optional)</label>
              <input id="edit-end" class="swal2-input" type="datetime-local" value="${task.end_time ? this.toLocalDatetime(task.end_time) : ''}" style="border-radius: 12px; padding: 12px; color: #000000;">
            </div>
          </div>
          
          <label style="display: block; margin: 16px 0 8px 0; font-weight: bold; color: #000000;">🖼️ Picture URL (Optional)</label>
          <input id="edit-picture" class="swal2-input" placeholder="https://example.com/image.jpg" value="${this.escapeHtml(task.picture || '')}" style="border-radius: 12px; padding: 12px; color: #000000;">
        </div>
      `,
      width: '700px',
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: '💾 Save Changes',
      confirmButtonColor: '#3b82f6',
      preConfirm: () => {
        const title = (document.getElementById('edit-title') as HTMLInputElement)?.value?.trim();
        const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value?.trim();
        const location = (document.getElementById('edit-location') as HTMLInputElement)?.value?.trim();
        const start_time = (document.getElementById('edit-start') as HTMLInputElement)?.value;
        const end_time = (document.getElementById('edit-end') as HTMLInputElement)?.value;
        const picture = (document.getElementById('edit-picture') as HTMLInputElement)?.value?.trim();

        if (!title || !description || !location || !start_time) {
          Swal.showValidationMessage(`
            <div style="text-align: left;">
              <strong>Required fields missing:</strong><br>
              • Title<br>
              • Description<br> 
              • Location<br>
              • Start time
            </div>
          `);
          return false;
        }

        if (end_time && new Date(end_time) < new Date(start_time)) {
          Swal.showValidationMessage('End time must be after start time');
          return false;
        }

        return { title, description, location, start_time, end_time: end_time || null, picture } as TaskPayload;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.taskService.updateTask(task.id, result.value).subscribe({
          next: (response) => {
            this.tasks = this.tasks.map(t => t.id === task.id ? response.task : t);
            this.cdr.detectChanges();
            Swal.fire({
              icon: 'success',
              title: '✅ Task Updated!',
              text: `Task "${response.task.title}" saved successfully.`,
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white'
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
