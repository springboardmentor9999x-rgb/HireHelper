import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task';
import { RequestService } from '../../services/request';
import { ToastService } from '../../services/toast';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class Feed implements OnInit {
  private readonly helperStatsStorageKey = 'helperDashboardStats';

  tasks: any[] = [];
  filteredTasks: any[] = [];
  availableCities: string[] = [];
  loading: boolean = false;

  // Filters
  searchQuery: string = '';
  selectedCity: string = '';
  selectedStatus: string = '';
  sortBy: string = 'latest'; // Default to latest first

  // Modal
  selectedTask: any = null;

  // Track tasks already requested in this session
  requestedTaskIds: Set<number> = new Set();
  requestMessages: Record<number, string> = {};

  // Profile Modal State
  isProfileModalOpen = false;
  profileUserId: number | null = null;
  profileUserName = '';
  profileUserRating: number | string | null = null;

  constructor(
    private taskService: TaskService,
      private requestService: RequestService,
      private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadMyRequestsState();
    this.loadTasks();
  }

  loadMyRequestsState() {
    // Step 1: Get all tasks we've already requested from the backend API
    this.requestService.getMyRequests().subscribe({
      next: (res: any) => {
        const myRequests = Array.isArray(res) ? res : [];
        
        // Step 2: Map the response into a Javascript Set of just task IDs to run O(1) lookups later!
        this.requestedTaskIds = new Set(
          myRequests
            .map((item: any) => item.task_id)
            .filter((taskId: any) => typeof taskId === 'number')
        );

        myRequests.forEach((item: any) => {
          if (typeof item.task_id === 'number') {
            this.requestMessages[item.task_id] = item.message || '';
          }
        });
      },
      error: () => {
        // Fallback: if API fails, just assume we haven't requested anything
        this.requestedTaskIds = new Set();
      }
    });
  }

  loadTasks() {
    this.loading = true;
    this.taskService.getFeed().subscribe(
      (res: any) => {
        this.tasks = res;
        this.extractCities();
        this.filterTasks();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    );
  }

  extractCities() {
    const cities = this.tasks
      .map(task => task.city)
      .filter((city, index, self) => city && self.indexOf(city) === index)
      .sort();
    this.availableCities = cities;
  }

  filterTasks() {
    let filtered = [...this.tasks];

    // Filter by city
    if (this.selectedCity) {
      filtered = filtered.filter(task => task.city === this.selectedCity);
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    // Basic sorting algorithm using native JS array sort and Date mapping
    switch (this.sortBy) {
      case 'latest':
        this.filteredTasks.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        this.filteredTasks.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'title':
        this.filteredTasks.sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        );
        break;
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterTasks();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return this.formatDate(dateString);
  }

  isNewTask(dateString: string): boolean {
    const taskDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - taskDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24; // Tasks posted in last 24 hours are "new"
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return labels[status] || status;
  }

  viewDetails(task: any) {
    this.selectedTask = task;
  }

  closeModal() {
    this.selectedTask = null;
  }

  openProfileModal(userId: number, userName: string, rating: number | string | null = null) {
    if (!userId) return;
    this.profileUserId = userId;
    this.profileUserName = userName;
    this.profileUserRating = rating;
    this.isProfileModalOpen = true;
  }

  requestTask(task: any) {
    if (task.status !== 'open') {
      this.toast.warning('This task is no longer available.');
      return;
    }

    if (this.requestedTaskIds.has(task.id)) {
      this.toast.info('You already requested this task.');
      return;
    }

    const message = (this.requestMessages[task.id] || '').trim();

    // Optimistically update the UI *before* the API finishes so it feels instantly fast!
    this.requestedTaskIds.add(task.id);
    this.toast.info(`Sending request for "${task.title}"...`);

    this.requestService.sendRequest(task.id, message).subscribe(
      () => {
        this.incrementHelperStatsCache();
        this.toast.success(`Request sent successfully for "${task.title}".`);
      },
      (error) => {
        // Validation failed or network error: Rollback the optimistic UI update
        this.requestedTaskIds.delete(task.id);
        const msg = error?.error?.error || 'Failed to send request. Please try again.';
        this.toast.error(msg);
      }
    );
  }

  hasRequested(taskId: number): boolean {
    return this.requestedTaskIds.has(taskId);
  }

  private incrementHelperStatsCache() {
    const defaultStats = {
      appliedTasks: 0,
      acceptedApplications: 0,
      pendingApplications: 0,
      completedJobs: 0,
    };

    try {
      const rawStats = localStorage.getItem(this.helperStatsStorageKey);
      const stats = rawStats ? { ...defaultStats, ...JSON.parse(rawStats) } : defaultStats;

      stats.appliedTasks += 1;
      stats.pendingApplications += 1;

      localStorage.setItem(this.helperStatsStorageKey, JSON.stringify(stats));
    } catch {
      localStorage.setItem(
        this.helperStatsStorageKey,
        JSON.stringify({
          appliedTasks: 1,
          acceptedApplications: 0,
          pendingApplications: 1,
          completedJobs: 0,
        })
      );
    }
  }
}
