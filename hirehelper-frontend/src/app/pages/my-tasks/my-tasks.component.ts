import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService, Task, TASK_CATEGORIES } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ReviewService } from '../../services/review.service';

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
    currentUserId: string | null = null;
    activeTab: 'posted' | 'helping' = 'posted';

    // Edit modal state
    editingTask: Task | null = null;
    editForm: Partial<Task> = {};
    isSaving = false;
    categories = TASK_CATEGORIES.filter(c => c !== 'All');

    // Proof modal state
    completingTask: Task | null = null;
    proofForm = { proof_note: '', proof_picture_url: '' };
    isCompleting = false;

    // Review modal state
    reviewingTask: Task | null = null;
    reviewForm = { rating: 5, comment: '' };
    isReviewing = false;
    reviewedTaskIds = new Set<string>();

    private toastService = inject(ToastService);
    private reviewService = inject(ReviewService);

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
                this.toastService.showError('Failed to load tasks. Please try again later.');
                console.error('Error fetching tasks:', err);
            }
        });
    }

    get postedTasks(): Task[] {
        return this.tasks.filter(t => t.user_id?.toString() === this.currentUserId);
    }

    get helpingTasks(): Task[] {
        return this.tasks.filter(t => t.assignee_id?.toString() === this.currentUserId);
    }

    setActiveTab(tab: 'posted' | 'helping'): void {
        this.activeTab = tab;
        this.cdr.detectChanges();
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

    openCompleteModal(task: Task): void {
        this.completingTask = task;
        this.proofForm = { proof_note: '', proof_picture_url: '' };
    }

    closeCompleteModal(): void {
        this.completingTask = null;
        this.isCompleting = false;
    }

    submitCompletion(): void {
        if (!this.completingTask?.id) return;
        this.isCompleting = true;
        this.taskService.markAsCompleted(this.completingTask.id, this.proofForm).subscribe({
            next: () => {
                this.toastService.showSuccess('Task marked as completed!');
                this.closeCompleteModal();
                this.fetchTasks();
            },
            error: (err) => {
                this.isCompleting = false;
                this.toastService.showError(err.error?.message || 'Failed to complete task.');
            }
        });
    }

    cancelTask(taskId: string): void {
        if (!confirm('Are you sure you want to cancel this task?')) return;
        this.taskService.cancelTask(taskId).subscribe({
            next: () => {
                this.toastService.showSuccess('Task cancelled successfully!');
                this.fetchTasks();
            },
            error: (err) => this.toastService.showError(err.error?.message || 'Failed to cancel task.')
        });
    }

    unassignTask(taskId: string): void {
        if (!confirm('Are you sure you want to unassign yourself from this task?')) return;
        this.taskService.unassignTask(taskId).subscribe({
            next: () => {
                this.toastService.showSuccess('Unassigned successfully!');
                this.fetchTasks();
            },
            error: (err) => this.toastService.showError(err.error?.message || 'Failed to unassign.')
        });
    }

    openReviewModal(task: Task): void {
        this.reviewingTask = task;
        this.reviewForm = { rating: 5, comment: '' };
    }

    closeReviewModal(): void {
        this.reviewingTask = null;
        this.isReviewing = false;
    }

    submitReview(): void {
        if (!this.reviewingTask?.id || !this.reviewingTask.assignee_id) return;
        this.isReviewing = true;
        
        const reviewData = {
            task_id: this.reviewingTask.id,
            reviewee_id: Number(this.reviewingTask.assignee_id),
            rating: this.reviewForm.rating,
            comment: this.reviewForm.comment
        };

        this.reviewService.createReview(reviewData).subscribe({
            next: () => {
                this.toastService.showSuccess('Review submitted!');
                this.reviewedTaskIds.add(this.reviewingTask!.id!);
                this.closeReviewModal();
                this.fetchTasks();
            },
            error: (err) => {
                this.isReviewing = false;
                this.toastService.showError(err.error?.message || 'Failed to submit review.');
            }
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
            case 'OPEN': return 'bg-green-100/50 text-green-700 border-2 border-green-200';
            case 'ASSIGNED': return 'bg-blue-100/50 text-blue-700 border-2 border-blue-200';
            case 'COMPLETED': return 'bg-yellow-100/50 text-yellow-700 border-2 border-yellow-200';
            case 'VERIFIED': return 'bg-purple-100/50 text-purple-700 border-2 border-purple-200';
            case 'CANCELLED': return 'bg-red-100/50 text-red-700 border-2 border-red-200';
            default: return 'bg-gray-100/50 text-gray-700 border-2 border-gray-200';
        }
    }

    getTaskProgress(status: string | undefined): number {
        switch (status?.toUpperCase()) {
            case 'OPEN': return 0;
            case 'ASSIGNED': return 1;
            case 'COMPLETED': return 2;
            case 'VERIFIED': return 3;
            default: return 0;
        }
    }
}
