import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MyRequestItem, TaskService } from '../../services/task.service';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './my-requests.html',
  styleUrls: ['./my-requests.css']
})
export class MyRequestsComponent implements OnInit {
  requests: MyRequestItem[] = [];
  loading = true;
  error = '';

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

    this.taskService.getMyRequests()
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
            : err.error?.message || 'Failed to load your requests';
          this.cdr.detectChanges();
        }
      });
  }
}
