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
export class WorkspaceShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
