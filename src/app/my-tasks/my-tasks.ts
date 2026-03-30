import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css']
})
export class MyTasksComponent implements OnInit {
  tasks: any[] = [];
  loading = true;
  message = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyTasks();
  }

  goBack(): void {
    window.history.back();
  }

  loadMyTasks(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.loading = false;
      this.message = 'Please login first';
      this.cdr.detectChanges();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.loading = true;
    this.message = '';
    this.tasks = [];

    this.http.get<any>('http://localhost:5000/api/tasks/my', { headers }).subscribe({
      next: (res) => {
        console.log('My Tasks response:', res);

        this.tasks = res?.tasks || [];
        this.loading = false;

        if (this.tasks.length === 0) {
          this.message = 'No tasks found';
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('My Tasks error:', err);
        this.loading = false;
        this.message = err.error?.message || 'Error loading my tasks';
        this.cdr.detectChanges();
      }
    });
  }
}