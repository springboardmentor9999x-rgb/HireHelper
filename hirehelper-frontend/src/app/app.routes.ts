import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { authGuard } from './guards/auth.guard';
import { Overview } from './pages/dashboard/overview/overview';
import { Profile } from './pages/dashboard/profile/profile';
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';
import { AddTaskComponent } from './pages/add-task/add-task.component';
import { FeedComponent } from './pages/feed/feed.component';
import { MyRequestsComponent } from './pages/my-requests/my-requests.component';
import { RequestsComponent } from './pages/requests/requests.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';


export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'verify-otp', component: VerifyOtp },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard],
        children: [
            { path: 'overview', component: Overview },
            { path: 'profile', component: Profile },
            { path: 'my-tasks', component: MyTasksComponent },
            { path: 'add-task', component: AddTaskComponent },
            { path: 'feed', component: FeedComponent },
            { path: 'my-requests', component: MyRequestsComponent },
            { path: 'requests', component: RequestsComponent },
            { path: 'notifications', component: NotificationsComponent },

            { path: '', redirectTo: 'overview', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
