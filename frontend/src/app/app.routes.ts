import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

function authGuard(): boolean {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
}

export const routes: Routes = [
  // Top-level auth routes
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent) },
  { path: 'verify-otp', loadComponent: () => import('./components/verify-otp/verify-otp').then(m => m.VerifyOtpComponent) },
  { path: 'forgot-password', loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },

  // Protected app shell with sidebar and child routes
  {
    path: 'dashboard',
    loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'feed' },
      { path: 'feed', loadComponent: () => import('./components/pages/feed').then(m => m.FeedComponent) },
      { path: 'my-tasks', loadComponent: () => import('./components/pages/my-tasks/my-tasks').then(m => m.MyTasksComponent) },
      { path: 'add-task', loadComponent: () => import('./components/pages/add-task/add-task').then(m => m.AddTaskComponent) },
      { path: 'profile', loadComponent: () => import('./components/pages/profile').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./components/pages/settings').then(m => m.SettingsComprehensiveComponent) },
      { path: 'activity', loadComponent: () => import('./components/pages/activity-dashboard').then(m => m.ActivityDashboardComponent) },
      { path: 'requests', loadComponent: () => import('./components/pages/requests').then(m => m.RequestsComponent) },
      { path: 'my-requests', loadComponent: () => import('./components/pages/my-requests').then(m => m.MyRequestsComponent) },
      { path: 'notifications', loadComponent: () => import('./components/pages/notifications/notifications').then(m => m.NotificationsComponent) },
    ]
  },

  // fallback
  { path: '**', redirectTo: 'login' }
];