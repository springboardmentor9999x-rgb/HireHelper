import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            { path: 'feed', loadComponent: () => import('./feed/feed.component').then(m => m.FeedComponent) },
            { path: 'my-tasks', loadComponent: () => import('./my-tasks/my-tasks.component').then(m => m.MyTasksComponent) },
            { path: 'requests', loadComponent: () => import('./requests/requests.component').then(m => m.RequestsComponent) },
            { path: 'my-requests', loadComponent: () => import('./my-requests/my-requests.component').then(m => m.MyRequestsComponent) },
            { path: 'notifications', loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent) },
            { path: 'add-task', loadComponent: () => import('./add-task/add-task.component').then(m => m.AddTaskComponent) },
            { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
            { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
            { path: '', redirectTo: 'feed', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
