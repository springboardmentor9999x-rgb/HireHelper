import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { TaskService, Task } from '../../../services/task.service';

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './overview.html',
})
export class Overview implements OnInit {
    tasks = signal<Task[]>([]);

    activeTasksCount = computed(() => {
        return this.tasks().filter(t => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'COMPLETED').length;
    });

    completedTasksCount = computed(() => {
        return this.tasks().filter(t => t.status === 'VERIFIED').length;
    });

    accountStatus = computed(() => {
        const user = this.authService.currentUser();
        if (!user) return 'Guest';
        return user.role === 'helper' ? 'Verified Helper' : 'Verified User';
    });

    constructor(
        public authService: AuthService,
        private taskService: TaskService
    ) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.taskService.getMyTasks().subscribe({
            next: (response) => {
                this.tasks.set(response.tasks);
            },
            error: (err) => {
                console.error('Error loading stats:', err);
            }
        });
    }
}

