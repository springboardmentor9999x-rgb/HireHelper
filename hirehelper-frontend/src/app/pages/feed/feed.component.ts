import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, TASK_CATEGORIES } from '../../services/task.service';
import { RequestService } from '../../services/request.service';
import { ToastService } from '../../services/toast.service';
import { inject } from '@angular/core';
import { RequestModalComponent } from '../../components/request-modal/request-modal.component';

@Component({
    selector: 'app-feed',
    standalone: true,
    imports: [CommonModule, RouterModule, RequestModalComponent, FormsModule],
    templateUrl: './feed.component.html',
    styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
    tasks: Task[] = [];
    loading = true;
    errorMessage = '';
    isModalOpen = false;
    selectedTask: Task | null = null;

    searchQuery = '';
    selectedCategory = 'All';
    categories = TASK_CATEGORIES;

    private toastService = inject(ToastService);
    private searchTimer: any;

    constructor(
        private taskService: TaskService,
        private requestService: RequestService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.fetchFeedTasks();
    }

    fetchFeedTasks(): void {
        this.loading = true;
        this.taskService.getFeedTasks(this.searchQuery, this.selectedCategory).subscribe({
            next: (res) => {
                this.tasks = res.tasks || [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = 'Failed to load task feed. Please try again later.';
                console.error('Error fetching feed tasks:', err);
                this.cdr.detectChanges();
            }
        });
    }

    onSearchChange(): void {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.fetchFeedTasks(), 400);
    }

    onCategoryChange(category: string): void {
        this.selectedCategory = category;
        this.fetchFeedTasks();
    }

    requestTask(task: Task): void {
        if (!task.id) return;
        this.selectedTask = task;
        this.isModalOpen = true;
    }

    onConfirmRequest(message: string): void {
        if (!this.selectedTask?.id) return;

        this.requestService.sendRequest(this.selectedTask.id, message).subscribe({
            next: (res) => {
                this.isModalOpen = false;
                this.toastService.showSuccess('Request sent successfully!');
                console.log('Request success:', res);
            },
            error: (err) => {
                this.isModalOpen = false;
                this.toastService.showError(err.error?.message || 'Failed to send request. Please try again.');
                console.error('Request error:', err);
            }
        });
    }

    onCancelRequest(): void {
        this.isModalOpen = false;
        this.selectedTask = null;
    }

    getStatusClass(status: string | undefined): string {
        switch (status?.toUpperCase()) {
            case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }
}
