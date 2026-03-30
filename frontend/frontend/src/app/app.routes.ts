import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { RegisterComponent } from './pages/register/register';
import { VerifyOtpComponent } from './pages/verify-otp/verify-otp';
import { AddTaskComponent } from './pages/add-task/add-task';
import { MyTasksComponent } from './pages/my-tasks/my-tasks';
import { FeedComponent } from './pages/feed/feed';
import { ProfileComponent } from './pages/profile/profile';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { WorkspaceShellComponent } from './components/workspace-shell/workspace-shell';
import { MyRequestsComponent } from './pages/my-requests/my-requests';
import { RequestsComponent } from './pages/requests/requests';
import { NotificationsComponent } from './pages/notifications/notifications';
import { HelpComponent } from './pages/help/help';
import { OffersComponent } from './pages/offers/offers';
import { LandingComponent } from './pages/landing/landing';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
{ path: 'verify-otp', component: VerifyOtpComponent },
  {
    path: '',
    component: WorkspaceShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'add-task', component: AddTaskComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { path: 'feed', component: FeedComponent },
      { path: 'my-requests', component: MyRequestsComponent },
      { path: 'requests', component: RequestsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'offers', component: OffersComponent },
      { path: 'help', component: HelpComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  { path: '**', redirectTo: 'register' }
];
