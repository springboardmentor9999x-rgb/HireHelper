import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService, Task } from '../../../services/task.service';
import { RatingDialogComponent } from '../../components/rating-dialog/rating-dialog.component';

type FilterTab = 'ALL' | 'OPEN' | 'ASSIGNED' | 'CLOSED' | 'COMPLETED';

@Component({
    selector: 'app-my-tasks',
    standalone: true,
    imports: [CommonModule, RouterModule, RatingDialogComponent],
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

    filterTab: FilterTab = 'ALL';

    // Status cycling state — track which card is cycling
    togglingStatusId: number | null = null;

    // Delete Modal state
    deleteModalOpen = false;
    taskToDelete: number | null = null;
    isDeleting = false;
    deleteError = '';

    // Rating Modal
    ratingModalOpen = false;
    selectedTaskForRating: Task | null = null;

    ngOnInit(): void {
        this.fetchMyTasks();
    }

    fetchMyTasks(): void {
        this.loading = true;
        this.error = null;
        this.taskService.getMyTasks().subscribe({
            next: (response) => {
                this.tasks = response.success ? (response.tasks || []) : [];
                if (!response.success) this.error = 'Failed to load your tasks.';
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to load your tasks. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get tabs(): { label: string; value: FilterTab; count: number }[] {
        return [
            { label: 'All', value: 'ALL', count: this.tasks.length },
            { label: 'Open', value: 'OPEN', count: this.tasks.filter(t => t.status?.toUpperCase() === 'OPEN').length },
            { label: 'Assigned', value: 'ASSIGNED', count: this.tasks.filter(t => t.status?.toUpperCase() === 'ASSIGNED').length },
            { label: 'Closed', value: 'CLOSED', count: this.tasks.filter(t => t.status?.toUpperCase() === 'CLOSED').length },
            { label: 'Completed', value: 'COMPLETED', count: this.tasks.filter(t => t.status?.toUpperCase() === 'COMPLETED').length },
        ];
    }

    get filteredTasks(): Task[] {
        if (this.filterTab === 'ALL') return this.tasks;
        return this.tasks.filter(t => t.status?.toUpperCase() === this.filterTab);
    }

    setFilter(tab: FilterTab): void {
        this.filterTab = tab;
        this.cdr.detectChanges();
    }

    // Status cycle: OPEN → ASSIGNED → CLOSED → OPEN
    nextStatusLabel(current: string | undefined): string {
        const map: Record<string, string> = {
            'OPEN': 'Assign',
            'ASSIGNED': 'Close',
            'CLOSED': 'Reopen',
        };
        return map[(current || 'OPEN').toUpperCase()] ?? 'Change Status';
    }

    nextStatusIcon(current: string | undefined): string {
        const map: Record<string, string> = {
            'OPEN': 'assign',
            'ASSIGNED': 'close',
            'CLOSED': 'reopen',
        };
        return map[(current || 'OPEN').toUpperCase()] ?? 'assign';
    }

    onCycleStatus(task: Task): void {
        if (!task.id || this.togglingStatusId === task.id) return;
        this.togglingStatusId = task.id;

        this.taskService.updateTaskStatus(task.id).subscribe({
            next: (res) => {
                if (res.success) {
                    const idx = this.tasks.findIndex(t => t.id === task.id);
                    if (idx !== -1) this.tasks[idx] = res.task;
                }
                this.togglingStatusId = null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.togglingStatusId = null;
                this.cdr.detectChanges();
            }
        });
    }

    onCompleteTask(task: Task): void {
        if (!task.id) return;
        this.taskService.completeTask(task.id).subscribe({
            next: (response) => {
                if (response.success) {
                    const index = this.tasks.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        this.tasks[index].status = 'COMPLETED';
                        this.selectedTaskForRating = this.tasks[index];
                        this.ratingModalOpen = true;
                    }
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error completing task', err)
        });
    }

    onRateTask(task: Task): void {
        this.selectedTaskForRating = task;
        this.ratingModalOpen = true;
    }

    closeRatingModal(): void {
        this.ratingModalOpen = false;
        this.selectedTaskForRating = null;
        this.cdr.detectChanges();
    }

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
            error: () => {
                this.deleteError = 'Failed to delete task. Please try again.';
                this.isDeleting = false;
                this.cdr.detectChanges();
            }
        });
    }
}