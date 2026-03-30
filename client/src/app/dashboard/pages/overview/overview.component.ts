import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService, Task } from '../../../services/task.service';
import { RequestService, Request } from '../../../services/request.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
    private taskService = inject(TaskService);
    private requestService = inject(RequestService);
    private cdr = inject(ChangeDetectorRef);

    stats = {
        totalTasks: 0,
        openTasks: 0,
        totalRequestsSent: 0,
        pendingRequestsSent: 0,
        totalRequestsReceived: 0
    };

    recentTasks: Task[] = [];
    loading = signal(true);

    ngOnInit(): void {
        this.loadOverviewData();
    }

    loadOverviewData(): void {
        console.log('[OverviewComponent] loadOverviewData started');
        this.loading.set(true);
        
        forkJoin({
            myTasks: this.taskService.getMyTasks(),
            myRequests: this.requestService.getMyRequests()
        }).subscribe({
            next: (data) => {
                console.log('[OverviewComponent] forkJoin emitted data:', data);
                // Task stats
                if (data.myTasks && data.myTasks.success) {
                    const tasks = data.myTasks.tasks || [];
                    this.stats.totalTasks = tasks.length;
                    this.stats.openTasks = tasks.filter(t => t.status === 'OPEN').length;
                    this.recentTasks = tasks.slice(0, 3);
                    console.log(`[OverviewComponent] Tasks processed: ${tasks.length}`);
                }

                // Request stats
                if (data.myRequests && data.myRequests.success) {
                    const requests = data.myRequests.requests || [];
                    this.stats.totalRequestsSent = requests.length;
                    this.stats.pendingRequestsSent = requests.filter(r => r.status === 'PENDING').length;
                    console.log(`[OverviewComponent] Requests processed: ${requests.length}`);
                }

                this.loading.set(false);
                console.log('[OverviewComponent] loading set to false');
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('[OverviewComponent] forkJoin error:', err);
                this.loading.set(false);
                this.cdr.detectChanges();
            }
        });
    }
}
