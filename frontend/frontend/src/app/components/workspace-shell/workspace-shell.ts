import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskService, NotificationItem } from '../../services/task.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-workspace-shell',
  standalone: true,
  imports: [RouterModule, RouterOutlet, CommonModule],
  templateUrl: './workspace-shell.html',
  styleUrls: ['./workspace-shell.css']
})
export class WorkspaceShellComponent implements OnInit {
  notificationCount = 0;

  private auth = inject(AuthService);
  private router = inject(Router);
  private taskService = inject(TaskService);

  ngOnInit(): void {
    this.taskService.notifications$.subscribe(count => {
      this.notificationCount = count;
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
