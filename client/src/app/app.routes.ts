import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';

// Dashboard page components
import { FeedComponent } from './dashboard/pages/feed/feed.component';
import { MyTasksComponent } from './dashboard/pages/my-tasks/my-tasks.component';
import { RequestsComponent } from './dashboard/pages/requests/requests.component';
import { MyRequestsComponent } from './dashboard/pages/my-requests/my-requests.component';
import { AddTaskComponent } from './dashboard/pages/add-task/add-task.component';
import { EditTaskComponent } from './dashboard/pages/edit-task/edit-task.component';
import { OverviewComponent } from './dashboard/pages/overview/overview.component';
import { SettingsComponent } from './dashboard/pages/settings/settings.component';
import { NotificationsComponent } from './dashboard/pages/notifications/notifications.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'overview', component: OverviewComponent },
            { path: 'feed', component: FeedComponent },
            { path: 'my-tasks', component: MyTasksComponent },
            { path: 'edit-task/:id', component: EditTaskComponent },
            { path: 'requests', component: RequestsComponent },
            { path: 'my-requests', component: MyRequestsComponent },
            { path: 'notifications', component: NotificationsComponent },
            { path: 'add-task', component: AddTaskComponent },
            { path: 'settings', component: SettingsComponent },
        ]
    },
];
