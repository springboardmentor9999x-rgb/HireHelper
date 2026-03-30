import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService, Task } from '../../../services/task.service';

@Component({
    selector: 'app-edit-task',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './edit-task.component.html',
    styleUrls: ['./edit-task.component.css']
})
export class EditTaskComponent implements OnInit {
    private fb = inject(FormBuilder);
    private taskService = inject(TaskService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    taskForm: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        location: ['', Validators.required],
        start_time: ['', Validators.required],
        end_time: [''],
        picture_url: ['', Validators.required],
        pay: ['', [Validators.required, Validators.min(0)]],
        status: ['OPEN']
    });

    loading = signal(false);
    fetching = signal(true);
    error: string | null = null;
    taskId: number | null = null;

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.taskId = +idParam;
            this.fetchTask(this.taskId);
        } else {
            this.error = 'Invalid task ID';
            this.fetching.set(false);
        }
    }

    fetchTask(id: number): void {
        console.log('[EditTaskComponent] fetchTask started for ID:', id);
        this.taskService.getTaskById(id).subscribe({
            next: (response) => {
                console.log('[EditTaskComponent] fetchTask response:', response);
                if (response && response.success && response.task) {
                    this.taskForm.patchValue({
                        title: response.task.title,
                        description: response.task.description,
                        location: response.task.location,
                        start_time: this.formatDateForInput(response.task.start_time),
                        end_time: response.task.end_time ? this.formatDateForInput(response.task.end_time) : '',
                        picture_url: response.task.picture_url,
                        pay: response.task.pay,
                        status: response.task.status
                    });
                } else {
                    this.error = 'Task not found';
                }
                this.fetching.set(false);
                console.log('[EditTaskComponent] fetching set to false');
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('[EditTaskComponent] fetchTask error:', err);
                this.error = 'Failed to load task details';
                this.fetching.set(false);
                this.cdr.detectChanges();
            }
        });
    }

    private formatDateForInput(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.taskForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    onSubmit(): void {
        if (this.taskForm.invalid || !this.taskId) {
            this.taskForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.error = null;

        this.taskService.updateTask(this.taskId, this.taskForm.value).subscribe({
            next: (response) => {
                if (response.success) {
                    this.router.navigate(['/dashboard/my-tasks']);
                } else {
                    this.error = 'Failed to update task. Please try again.';
                    this.loading.set(false);
                }
            },
            error: (err) => {
                console.error('Error updating task', err);
                this.error = 'Failed to update task. Please try again.';
                this.loading.set(false);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/my-tasks']);
    }
}
