import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../../../core/services/task.service';
import { LanguageService } from '../../../core/services/language.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css'
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  isLoading = true;
  errorMsg = '';
  editingTaskId: string | null = null;
  editData: any = {};
  labels: any = {};
  minDateTime: string = '';
  apiUrl = environment.apiUrl;

  // Custom Confirm Modal State
  isConfirmModalOpen = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalAction: (() => void) | null = null;
  confirmModalButtonText = 'Confirm';
  confirmModalButtonClass = 'btn-danger';

  constructor(
    private taskService: TaskService,
    private router: Router,
    private langService: LanguageService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.langService.lang$.subscribe(() => {
      this.labels = this.langService.getLabels();
    });

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.minDateTime = now.toISOString().slice(0, 16);

    this.fetchTasks();
  }

  getTaskImage(task: any): string {
    return this.taskService.resolveTaskImage(task);
  }

  onImageError(event: any, task: any) {
    if (!event.target.dataset.fallbackApplied) {
      event.target.dataset.fallbackApplied = 'true';
      event.target.src = this.taskService.getTaskImageFallback(task?.title, task?.id);
    } else if (event.target.dataset.fallbackApplied === 'true') {
      event.target.dataset.fallbackApplied = 'final';
      event.target.src = 'https://placehold.co/800x500/eeeeee/999999?text=Task+Image';
    }
  }

  fetchTasks(): void {
    this.taskService.getMyTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load tasks.';
        this.isLoading = false;
      }
    });
  }

  formatDateForInput(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  startEdit(task: Task): void {
    this.editingTaskId = task.id || null;
    let amt = '', cur = 'rs', t = '/ hr';
    if (task.pay) {
      const match = task.pay.match(/([\d\.]+)\s*(rs|\$|€|£)?\s*(.*)/i);
      if (match) {
        amt = match[1] || '';
        cur = match[2]?.toLowerCase() || 'rs';
        t = match[3] || 'total';
      } else {
        amt = task.pay;
      }
    }
    this.editData = {
      title: task.title,
      description: task.description || '',
      location: task.location || '',
      start_time: this.formatDateForInput(task.start_time),
      end_time: this.formatDateForInput(task.end_time),
      pay_amount: amt,
      pay_currency: cur,
      pay_type: t
    };
  }

  cancelEdit(): void {
    this.editingTaskId = null;
    this.editData = {};
  }

  saveEdit(): void {
    if (!this.editingTaskId) return;

    if (this.editData.pay_amount) {
      this.editData.pay = `${this.editData.pay_amount} ${this.editData.pay_currency} ${this.editData.pay_type}`.replace(/\s+/g, ' ').trim();
    } else {
      this.editData.pay = '';
    }

    this.taskService.updateTask(this.editingTaskId, this.editData).subscribe({
      next: () => {
        this.editingTaskId = null;
        this.editData = {};
        this.fetchTasks();
        this.modalService.show('Success', 'Task updated successfully', 'success');
      },
      error: (err) => {
        this.modalService.show('Error', err?.error?.msg || 'Failed to update task.', 'error');
      }
    });
  }

  deleteTask(task: Task): void {
    if (!task.id) return;
    const msg = this.labels.confirmDelete || 'Are you sure you want to delete this task?';
    
    this.openConfirmModal('Delete Task', msg, 'Delete', 'btn-delete', () => {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.fetchTasks();
        },
        error: (err) => {
          this.errorMsg = err?.error?.msg || 'Failed to delete task.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    });
  }

  toggleStatus(task: Task): void {
    if (!task.id) return;
    const newStatus = task.status === 'open' ? 'closed' : 'open';
    const msg = `Are you sure you want to mark this task as ${newStatus}?`;
    
    this.openConfirmModal('Update Status', msg, 'Confirm', 'btn-primary', () => {
      this.taskService.toggleTaskStatus(task.id!, newStatus).subscribe({
        next: () => {
          this.fetchTasks();
        },
        error: (err) => {
          this.errorMsg = err?.error?.msg || 'Failed to update task status.';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      });
    });
  }

  // Modal Handlers
  openConfirmModal(title: string, message: string, buttonText: string, buttonClass: string, action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalButtonText = buttonText;
    this.confirmModalButtonClass = buttonClass;
    this.confirmModalAction = action;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal() {
    this.isConfirmModalOpen = false;
    this.confirmModalAction = null;
  }

  executeConfirmModal() {
    if (this.confirmModalAction) {
      this.confirmModalAction();
    }
    this.closeConfirmModal();
  }
}
