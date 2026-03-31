import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../../core/services/task.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';

export interface FeedTask extends Task {
  first_name?: string;
  last_name?: string;
  user_picture?: string;
  applied?: boolean;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  tasks: FeedTask[] = [];
  isLoading = true;
  errorMsg = '';
  apiUrl = environment.apiUrl;
  labels: any = {};
  selectedTaskForRequest: FeedTask | null = null;
  requestMessage: string = '';

  constructor(
    private taskService: TaskService,
    private langService: LanguageService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.langService.lang$.subscribe(() => {
      this.labels = this.langService.getLabels();
    });
    this.fetchFeed();
  }

  fetchFeed(): void {
    this.isLoading = true;
    this.errorMsg = '';
    
    this.taskService.getFeedTasks().subscribe({
      next: (data: any) => {
        this.tasks = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load feed.';
        this.isLoading = false;
      }
    });
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

  onRequestTask(task: FeedTask): void {
    if (!task.id) return;
    this.selectedTaskForRequest = task;
    this.requestMessage = '';
  }

  confirmRequest(): void {
    if (!this.selectedTaskForRequest?.id) return;
    this.taskService.requestTask(this.selectedTaskForRequest.id, this.requestMessage).subscribe({
      next: () => {
        this.modalService.show('Success', 'Your request to help has been sent!', 'success');
        this.selectedTaskForRequest = null;
        this.requestMessage = '';
      },
      error: (err) => {
        this.modalService.show('Error', err?.error?.msg || 'Failed to send request.', 'error');
        this.selectedTaskForRequest = null;
      }
    });
  }

  cancelRequest(): void {
    this.selectedTaskForRequest = null;
    this.requestMessage = '';
  }
}
