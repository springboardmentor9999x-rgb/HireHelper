import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './guards/auth-guard';
import { AddTaskComponent } from './add-task/add-task';
import { MyTasksComponent } from './my-tasks/my-tasks';
import { FeedComponent } from './feed/feed';
import { VerifyComponent } from './verify/verify';
import { MyRequestsComponent } from './my-requests/my-requests';
import { RequestsComponent } from './requests/requests';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'verify', component: VerifyComponent },
  { path: 'add-task', component: AddTaskComponent, canActivate: [AuthGuard] },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [AuthGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
    { path: 'my-requests', component: MyRequestsComponent },
  { path: 'requests', component: RequestsComponent }
  
];