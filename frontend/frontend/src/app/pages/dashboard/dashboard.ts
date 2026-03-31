import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import { TaskService } from '../../services/task.service';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports:[CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  userName = "User";
  userEmail = '';
  statsLoading = true;
  stats = {
    hirers: 0,
    requested: 0,
    helpers: 0,
    openTasks: 0
  };

  constructor(
    private auth: AuthService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    const user = this.auth.getStoredUser();
    this.userName = user?.first_name || 'User';
    this.userEmail = user?.email_id || '';
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    const currentUserId = this.auth.getStoredUser()?.id;
    this.statsLoading = true;

    forkJoin({
      feedTasks: this.taskService.getFeedTasks().pipe(timeout(8000), catchError(() => of([]))),
      receivedRequests: this.taskService.getReceivedRequests().pipe(timeout(8000), catchError(() => of([]))),
      myRequests: this.taskService.getMyRequests().pipe(timeout(8000), catchError(() => of([])))
    })
      .pipe(
        finalize(() => {
          this.statsLoading = false;
        })
      )
      .subscribe(({ feedTasks, receivedRequests, myRequests }) => {
        const uniqueHirers = new Set(
          feedTasks
            .map((task) => task.user_id)
            .filter((userId) => !!userId && userId !== currentUserId)
        );

        const acceptedHelpers = new Set(
          receivedRequests
            .filter((request) => request.status === 'ACCEPTED')
            .map((request) => request.requester_id)
        );

        this.stats = {
          hirers: uniqueHirers.size,
          requested: receivedRequests.length + myRequests.length,
          helpers: acceptedHelpers.size,
          openTasks: feedTasks.filter((task) => task.status === 'OPEN').length
        };
        
        console.log('Dashboard stats updated:', this.stats);
        console.log('API Results:', { feedTasks: feedTasks.length, receivedRequests: receivedRequests.length, myRequests: myRequests.length });
        this.cdr.detectChanges();
      });
  }

  logout(){
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
