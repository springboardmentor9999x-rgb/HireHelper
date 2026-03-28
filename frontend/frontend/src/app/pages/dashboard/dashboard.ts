import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports:[CommonModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {

  userName = "User";
  userEmail = '';

  constructor(private auth:AuthService, private router:Router){
    const user = this.auth.getStoredUser();
    this.userName = user?.first_name || 'User';
    this.userEmail = user?.email_id || '';
  }

  logout(){
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
