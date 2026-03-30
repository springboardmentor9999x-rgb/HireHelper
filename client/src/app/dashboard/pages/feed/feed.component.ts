import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService, Task } from '../../../services/task.service';
import { RequestService } from '../../../services/request.service';

@Component({
    selector: 'app-feed',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './feed.component.html',
    styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
    private taskService = inject(TaskService);
    private requestService = inject(RequestService);
    private cdr = inject(ChangeDetectorRef);

    tasks: Task[] = [];
    loading = true;
    error: string | null = null;

    // Modal state
    modalOpen = false;
    modalState: 'form' | 'success' | 'error' = 'form';
    selectedTask: Task | null = null;
    requestMessage = '';
    submitting = false;
    errorMessage = '';

    ngOnInit(): void {
        this.fetchFeedTasks();
    }

    fetchFeedTasks(): void {
        this.loading = true;
        this.error = null;

        this.taskService.getFeedTasks().subscribe({
            next: (response) => {
                if (response && response.success) {
                    this.tasks = response.tasks || [];
                } else {
                    this.error = 'Failed to load feed.';
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to load feed. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openRequestModal(task: Task): void {
        this.selectedTask = task;
        this.requestMessage = '';
        this.modalState = 'form';
        this.submitting = false;
        this.errorMessage = '';
        this.modalOpen = true;
        this.cdr.detectChanges();
    }

    closeModal(): void {
        this.modalOpen = false;
        this.selectedTask = null;
        this.cdr.detectChanges();
    }

    submitRequest(): void {
        if (!this.selectedTask) return;
        this.submitting = true;

        const requestData = {
            task_id: this.selectedTask.id!,
            message: this.requestMessage.trim()
        };

        this.requestService.createRequest(requestData).subscribe({
            next: (response) => {
                this.submitting = false;
                if (response.success) {
                    this.modalState = 'success';
                } else {
                    this.errorMessage = 'Failed to send request. Please try again.';
                    this.modalState = 'error';
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.submitting = false;
                this.errorMessage = err.error?.message || 'Failed to send request. Please try again.';
                this.modalState = 'error';
                this.cdr.detectChanges();
            }
        });
    }
}