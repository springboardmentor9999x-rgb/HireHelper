import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReceivedRequestItem, TaskService } from '../../services/task.service';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css']
})
export class RequestsComponent implements OnInit {
  requests: ReceivedRequestItem[] = [];
  loading = true;
  error = '';
  actionMessage = '';

  constructor(
    private taskService: TaskService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadRequests(): void {
    this.loading = true;
    this.error = '';
    this.actionMessage = '';

    this.taskService.getReceivedRequests()
      .pipe(
        timeout(10000)
      )
      .subscribe({
        next: (requests) => {
          this.requests = requests;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.name === 'TimeoutError'
            ? 'Request list timed out. Check that the backend is running and then refresh.'
            : err.error?.message || 'Failed to load incoming requests';
          this.cdr.detectChanges();
        }
      });
  }

  respondToRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED'): void {
    this.error = '';
    this.actionMessage = '';

    this.taskService.updateRequestStatus(requestId, status).subscribe({
      next: (response) => {
        this.requests = this.requests.map((request) =>
          request.id === requestId ? { ...request, status } : request
        );
        this.actionMessage = response.message || `Request ${status.toLowerCase()}`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update request';
        this.cdr.detectChanges();
      }
    });
  }
}
