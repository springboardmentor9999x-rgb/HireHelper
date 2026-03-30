import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService, Task } from '../../../services/task.service';

@Component({
    selector: 'app-my-tasks',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-tasks.component.html',
    styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
    private taskService = inject(TaskService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    tasks: Task[] = [];
    loading = true;
    error: string | null = null;
    
    // Filter state
    filterStatus: 'OPEN' | 'COMPLETED' = 'OPEN';

    ngOnInit(): void {
        this.fetchMyTasks();
    }

    fetchMyTasks(): void {
        this.loading = true;
        this.error = null;

        this.taskService.getMyTasks().subscribe({
            next: (response) => {
                if (response && response.success) {
                    this.tasks = response.tasks || [];
                } else {
                    this.error = 'Failed to load your tasks.';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = 'Failed to load your tasks. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get filteredTasks(): Task[] {
        return this.tasks.filter(task => {
            if (this.filterStatus === 'OPEN') {
                return task.status !== 'COMPLETED';
            } else {
                return task.status === 'COMPLETED';
            }
        });
    }

    setFilter(status: 'OPEN' | 'COMPLETED'): void {
        this.filterStatus = status;
        this.cdr.detectChanges();
    }

    // Delete Modal state
    deleteModalOpen = false;
    taskToDelete: number | null = null;
    isDeleting = false;
    deleteError = '';

    onEditTask(taskId: number | undefined): void {
        if (!taskId) return;
        this.router.navigate(['/dashboard/edit-task', taskId]);
    }

    onDeleteClick(taskId: number | undefined): void {
        if (!taskId) return;
        this.taskToDelete = taskId;
        this.deleteError = '';
        this.isDeleting = false;
        this.deleteModalOpen = true;
    }

    closeDeleteModal(): void {
        if (this.isDeleting) return;
        this.deleteModalOpen = false;
        this.taskToDelete = null;
        this.deleteError = '';
    }

    confirmDelete(): void {
        if (!this.taskToDelete) return;
        
        this.isDeleting = true;
        this.deleteError = '';

        this.taskService.deleteTask(this.taskToDelete).subscribe({
            next: (response) => {
                if (response.success) {
                    this.tasks = this.tasks.filter(t => t.id !== this.taskToDelete);
                    this.closeDeleteModal();
                } else {
                    this.deleteError = 'Failed to delete task. Please try again.';
                    this.isDeleting = false;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error deleting task', err);
                this.deleteError = 'Failed to delete task. Please try again.';
                this.isDeleting = false;
                this.cdr.detectChanges();
            }
        });
    }

    onCompleteTask(taskId: number | undefined): void {
        if (!taskId) return;

        this.taskService.completeTask(taskId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Update the task status locally
                    const index = this.tasks.findIndex(t => t.id === taskId);
                    if (index !== -1) {
                        this.tasks[index].status = 'COMPLETED';
                    }
                } else {
                    alert('Failed to mark task as completed.');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error completing task', err);
                alert('An error occurred while marking the task as completed.');
            }
        });
    }
}