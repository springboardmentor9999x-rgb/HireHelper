import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { OtpComponent } from './pages/otp/otp';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Feed } from './pages/feed/feed';
import { AddTask } from './pages/add-task/add-task';
import { MyTasks } from './pages/my-tasks/my-tasks';
import { Requests } from './pages/requests/requests';
import { MyRequests } from './pages/my-requests/my-requests';
import { Settings } from './pages/settings/settings';
import { NotificationsComponent } from './pages/notifications/notifications';
import { authGuard } from './guards/auth-guard';
import { SidebarLayoutComponent } from './components/sidebar-layout/sidebar-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'otp', component: OtpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  {
    path: '',
    component: SidebarLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'feed', component: Feed },
      { path: 'add-task', component: AddTask },
      { path: 'my-tasks', component: MyTasks },
      { path: 'requests', component: Requests },
      { path: 'my-requests', component: MyRequests },
      { path: 'settings', component: Settings },
      { path: 'notifications', component: NotificationsComponent },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
