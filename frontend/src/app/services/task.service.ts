import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  baseUrl = 'http://localhost:5000/api/tasks';

  constructor(private http: HttpClient) {}

  getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  getMyTasks() {
    return this.http.get(`${this.baseUrl}/my`, this.getHeaders());
  }

  getFeedTasks() {
    return this.http.get(`${this.baseUrl}/feed`, this.getHeaders());
  }

  createTask(data: any) {
    return this.http.post(this.baseUrl, data, this.getHeaders());
  }

  deleteTask(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders());
  }
}