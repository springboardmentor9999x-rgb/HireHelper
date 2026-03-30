import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TaskService, TASK_CATEGORIES } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-add-task',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './add-task.component.html',
    styleUrls: ['./add-task.component.css']
})
export class AddTaskComponent implements OnInit {
    taskForm!: FormGroup;
    loading = false;
    categories = TASK_CATEGORIES.filter(c => c !== 'All');
    private toastService = inject(ToastService);

    constructor(
        private fb: FormBuilder,
        private taskService: TaskService,
        private router: Router
    ) {
        this.taskForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', [Validators.required]],
            location: ['', [Validators.required]],
            start_time: ['', [Validators.required]],
            end_time: [''],
            picture_url: [''],
            category: ['Other']
        });
    }

    ngOnInit(): void { }

    onSubmit(): void {
        if (this.taskForm.invalid) {
            this.markFormGroupTouched(this.taskForm);
            return;
        }

        this.loading = true;

        this.taskService.createTask(this.taskForm.value).subscribe({
            next: (res) => {
                this.toastService.showSuccess('Task created successfully! Tracking progress.');
                this.router.navigate(['/dashboard/my-tasks']);
            },
            error: (err) => {
                this.loading = false;
                this.toastService.showError(err.error?.message || 'Something went wrong. Please try again.');
            }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as any).controls) {
                this.markFormGroupTouched(control as any);
            }
        });
    }
}
