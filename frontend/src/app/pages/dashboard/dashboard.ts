import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TaskService } from '../../services/task';
import { RequestService } from '../../services/request';
import { NotificationService } from '../../services/notification';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private readonly employerStatsStorageKey = 'employerDashboardStats';
  private readonly helperStatsStorageKey = 'helperDashboardStats';

  private taskService = inject(TaskService);
  private requestService = inject(RequestService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  role: string = 'HELPER';
  userName: string = 'User';

  notifications = 0;
  private notificationPollHandle: number | null = null;
  private dashboardPollHandle: number | null = null;
  private initializedNotificationIds = new Set<number>();
  private notificationsBootstrapped = false;

  activeTasks = 0;
  totalHelpers = 0;
  pendingRequests = 0;
  completedTasks = 0;

  appliedTasks = 0;
  acceptedApplications = 0;
  pendingApplications = 0;
  completedJobs = 0;

  get isEmployer(): boolean {
    return this.role === 'HIRER' || this.role === 'EMPLOYER';
  }

  get isHelper(): boolean {
    return this.role === 'HELPER';
  }

  ngOnInit(): void {
    const rawRole = (localStorage.getItem('userRole') || 'helper').trim().toUpperCase();
    this.role = rawRole;
    this.userName = localStorage.getItem('userName') || 'User';

    const roleLabel = this.isEmployer ? 'Employer' : 'Helper';
    this.toast.info(`Welcome ${this.userName} (${roleLabel})`);

    if (this.isEmployer) {
      this.applyCachedEmployerStats();
    }

    if (this.isHelper) {
      this.applyCachedHelperStats();
    }

    this.loadDashboardData();
    this.loadNotifications();

    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.notificationPollHandle !== null) {
      window.clearInterval(this.notificationPollHandle);
    }

    if (this.dashboardPollHandle !== null) {
      window.clearInterval(this.dashboardPollHandle);
    }
  }

  loadDashboardData(): void {
    if (this.isEmployer) {
      this.loadEmployerDashboard();
    } else {
      this.loadHelperDashboard();
    }
  }

  loadEmployerDashboard(): void {
    forkJoin({
      myTasks: this.taskService.getMyTasks().pipe(catchError(() => of([]))),
      incomingRequests: this.requestService.getIncomingRequests().pipe(catchError(() => of([])))
    }).subscribe(({ myTasks, incomingRequests }: any) => {
      const tasks = Array.isArray(myTasks) ? myTasks : [];
      const requests = Array.isArray(incomingRequests) ? incomingRequests : [];

      this.activeTasks = tasks.filter((t: any) => t?.status === 'open' || t?.status === 'in_progress').length;
      this.completedTasks = tasks.filter((t: any) => t?.status === 'completed').length;
      this.pendingRequests = requests.filter((r: any) => r?.status === 'PENDING').length;

      // use a Set to uniquely count helpers applying to tasks (avoids double counting eager candidates)
      const uniqueHelpers = new Set(
        requests.map((r: any) => r?.requester_name).filter(Boolean)
      );
      this.totalHelpers = uniqueHelpers.size;

      this.persistEmployerStats();
    });
  }

  private applyCachedEmployerStats(): void {
    const rawStats = localStorage.getItem(this.employerStatsStorageKey);

    if (!rawStats) {
      return;
    }

    try {
      const stats = JSON.parse(rawStats);
      this.activeTasks = Number(stats?.activeTasks) || 0;
      this.totalHelpers = Number(stats?.totalHelpers) || 0;
      this.pendingRequests = Number(stats?.pendingRequests) || 0;
      this.completedTasks = Number(stats?.completedTasks) || 0;
    } catch {
      // cache is corrupted, nuke it
      localStorage.removeItem(this.employerStatsStorageKey);
    }
  }

  private persistEmployerStats(): void {
    localStorage.setItem(
      this.employerStatsStorageKey,
      JSON.stringify({
        activeTasks: this.activeTasks,
        totalHelpers: this.totalHelpers,
        pendingRequests: this.pendingRequests,
        completedTasks: this.completedTasks,
      })
    );
  }

  loadHelperDashboard(): void {
    this.requestService.getMyRequests().pipe(catchError(() => of([]))).subscribe((res: any) => {
      const requests = Array.isArray(res) ? res : [];

      this.appliedTasks = requests.length;
      this.acceptedApplications = requests.filter((r: any) => r?.status === 'ACCEPTED').length;
      this.pendingApplications = requests.filter((r: any) => r?.status === 'PENDING').length;
      this.completedJobs = requests.filter((r: any) => r?.status === 'COMPLETED').length;

      this.persistHelperStats();
    });
  }

  private applyCachedHelperStats(): void {
    const rawStats = localStorage.getItem(this.helperStatsStorageKey);

    if (!rawStats) {
      return;
    }

    try {
      const stats = JSON.parse(rawStats);
      this.appliedTasks = Number(stats?.appliedTasks) || 0;
      this.acceptedApplications = Number(stats?.acceptedApplications) || 0;
      this.pendingApplications = Number(stats?.pendingApplications) || 0;
      this.completedJobs = Number(stats?.completedJobs) || 0;
    } catch {
      localStorage.removeItem(this.helperStatsStorageKey);
    }
  }

  private persistHelperStats(): void {
    localStorage.setItem(
      this.helperStatsStorageKey,
      JSON.stringify({
        appliedTasks: this.appliedTasks,
        acceptedApplications: this.acceptedApplications,
        pendingApplications: this.pendingApplications,
        completedJobs: this.completedJobs,
      })
    );
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().pipe(catchError(() => of([]))).subscribe((res: any) => {
      const list = Array.isArray(res) ? res : [];
      this.notifications = list.filter((n: any) => n?.is_read === false).length;

      if (!this.notificationsBootstrapped) {
        list.forEach((n: any) => {
          if (typeof n?.id === 'number') {
            this.initializedNotificationIds.add(n.id);
          }
        });
        this.notificationsBootstrapped = true;
        return;
      }

      const unreadNewNotifications = list.filter(
        (n: any) =>
          n?.is_read === false &&
          typeof n?.id === 'number' &&
          !this.initializedNotificationIds.has(n.id)
      );

      // skip annoying popup toasts, just quietly track what we've already synced
      list.forEach((n: any) => {
        if (typeof n?.id === 'number') {
          this.initializedNotificationIds.add(n.id);
        }
      });
    });
  }

  private startPolling(): void {
    this.notificationPollHandle = window.setInterval(() => {
      this.loadNotifications();
    }, 8000);

    this.dashboardPollHandle = window.setInterval(() => {
      this.loadDashboardData();
    }, 10000);
  }

}
