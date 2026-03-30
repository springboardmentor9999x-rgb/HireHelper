import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';

@Component({
    selector: 'app-add-task',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './add-task.component.html',
    styleUrls: ['./add-task.component.css']
})
export class AddTaskComponent {
    private fb = inject(FormBuilder);
    private taskService = inject(TaskService);
    private router = inject(Router);

    taskForm: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        location: ['', Validators.required],
        start_time: ['', Validators.required],
        end_time: [''],
        picture_url: ['', Validators.required],
        pay: ['', [Validators.required, Validators.min(0)]]
    });

    loading = false;
    error: string | null = null;
    successMessage: string | null = null;

    isFieldInvalid(fieldName: string): boolean {
        const field = this.taskForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    onSubmit(): void {
        if (this.taskForm.invalid) {
            this.taskForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;

        this.taskService.createTask(this.taskForm.value).subscribe({
            next: (response) => {
                if (response.success) {
                    this.successMessage = '🎉 Task created successfully! Redirecting...';
                    this.loading = false;
                    setTimeout(() => this.router.navigate(['/dashboard/my-tasks']), 1500);
                } else {
                    this.error = 'Failed to create task. Please try again.';
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error('AddTaskComponent: Error creating task', err);
                this.error = 'Failed to create task. Please try again.';
                this.loading = false;
            }
        });
    }

    resetForm(): void {
        this.taskForm.reset();
    }
}
