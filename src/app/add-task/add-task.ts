import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css']
})
export class AddTaskComponent {

  taskForm: FormGroup;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      Loc: [''],
      start_time: ['', Validators.required],
      end_time: [''],
      picture: ['']
    });
  }
  goBack(): void {
  window.history.back();
}

  onSubmit() {

    if (this.taskForm.invalid) {
      return;
    }

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    this.http.post('http://localhost:5000/api/tasks', this.taskForm.value, { headers })
      .subscribe({
        next: () => {
          alert('Task created successfully');
          this.router.navigate(['/my-tasks']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Server Error';
        }
      });
  }
}