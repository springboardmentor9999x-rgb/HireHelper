import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  isSidebarCollapsed = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
