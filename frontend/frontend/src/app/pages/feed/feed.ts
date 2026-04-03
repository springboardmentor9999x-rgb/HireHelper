import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskItem, TaskService } from '../../services/task.service';
import { finalize, timeout } from 'rxjs';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import { OfferItem } from '../offers/offers';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class FeedComponent implements OnInit {
  tasks: TaskItem[] = [];
  topOffersByUserId: Record<string, OfferItem | null> = {};
  loading = true;
  error = '';
  actionMessage = '';
  requestingTaskId: string | null = null;
  requestedTaskIds = new Set<string>();

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadRequestedTasks();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  requestTask(task: TaskItem): void {
    if (this.requestingTaskId || this.isRequestDisabled(task)) {
      return;
    }

    this.actionMessage = '';
    this.error = '';
    this.requestingTaskId = task.id;

    this.taskService.requestTask(task.id).subscribe({
      next: (response) => {
        this.requestedTaskIds.add(task.id);
        this.actionMessage = response.message;
        this.requestingTaskId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send request';
        this.requestingTaskId = null;
        this.cdr.detectChanges();
      }
    });
  }

  private loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getFeedTasks()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.buildTopOffersByUserMap(tasks);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.name === 'TimeoutError'
          ? 'Feed request timed out. Check that the backend is running and then refresh.'
          : err.error?.message || 'Failed to load feed';
        this.cdr.detectChanges();
      }
    });
  }

  private loadRequestedTasks(): void {
    this.taskService.getMyRequests().subscribe({
      next: (requests) => {
        this.requestedTaskIds = new Set(requests.map((request) => request.task_id));
        this.cdr.detectChanges();
      },
      error: () => {
        // Ignore request list errors so feed still loads.
      }
    });
  }

  isRequestDisabled(task: TaskItem): boolean {
    return task.status !== 'OPEN' || this.requestedTaskIds.has(task.id);
  }

  getTopOfferForTask(task: TaskItem): OfferItem | null {
    if (!task.user_id) {
      return null;
    }

    return this.topOffersByUserId[task.user_id] || null;
  }

  private buildTopOffersByUserMap(tasks: TaskItem[]): void {
    const ownerIds = Array.from(new Set(tasks.map((task) => task.user_id).filter(Boolean)));
    const topOffers: Record<string, OfferItem | null> = {};

    ownerIds.forEach((ownerId) => {
      const offers = this.taskService.getStoredOffersForUser<OfferItem>(ownerId);

      if (!offers.length) {
        topOffers[ownerId] = null;
        return;
      }

      topOffers[ownerId] = [...offers].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    });

    this.topOffersByUserId = topOffers;
  }
}
