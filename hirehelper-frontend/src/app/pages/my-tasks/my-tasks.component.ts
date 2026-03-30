import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService, Task, TASK_CATEGORIES } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-my-tasks',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './my-tasks.component.html',
    styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
    tasks: Task[] = [];
    loading = true;
    errorMessage = '';
    currentUserId: string | null = null;

    // Edit modal state
    editingTask: Task | null = null;
    editForm: Partial<Task> = {};
    isSaving = false;
    categories = TASK_CATEGORIES.filter(c => c !== 'All');

    private toastService = inject(ToastService);

    constructor(
        private taskService: TaskService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const user = this.authService.currentUser();
        this.currentUserId = user?.id?.toString() ?? null;
        this.fetchTasks();
    }

    fetchTasks(): void {
        this.loading = true;
        this.taskService.getMyTasks().subscribe({
            next: (res) => {
                this.tasks = res.tasks || [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = 'Failed to load tasks. Please try again later.';
                console.error('Error fetching tasks:', err);
            }
        });
    }

    openEditModal(task: Task): void {
        this.editingTask = task;
        this.editForm = {
            title: task.title,
            description: task.description,
            location: task.location,
            start_time: task.start_time,
            end_time: task.end_time,
            picture_url: task.picture_url,
            category: task.category || 'Other'
        };
    }

    closeEditModal(): void {
        this.editingTask = null;
        this.editForm = {};
        this.isSaving = false;
    }

    saveEdit(): void {
        if (!this.editingTask?.id) return;
        this.isSaving = true;
        this.taskService.updateTask(this.editingTask.id, this.editForm).subscribe({
            next: () => {
                this.toastService.showSuccess('Task updated successfully!');
                this.closeEditModal();
                this.fetchTasks();
            },
            error: (err) => {
                this.isSaving = false;
                this.toastService.showError(err.error?.message || 'Failed to update task.');
            }
        });
    }

    markAsCompleted(taskId: string): void {
        this.taskService.markAsCompleted(taskId).subscribe({
            next: () => {
                this.toastService.showSuccess('Task marked as completed!');
                this.fetchTasks();
            },
            error: (err) => this.toastService.showError(err.error?.message || 'Failed to mark task as completed.')
        });
    }

    verifyCompletion(taskId: string): void {
        this.taskService.verifyCompletion(taskId).subscribe({
            next: () => {
                this.toastService.showSuccess('Task verified successfully!');
                this.fetchTasks();
            },
            error: (err) => this.toastService.showError(err.error?.message || 'Failed to verify task.')
        });
    }

    getStatusClass(status: string | undefined): string {
        switch (status?.toUpperCase()) {
            case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'VERIFIED': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }
}
