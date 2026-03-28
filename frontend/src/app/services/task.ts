import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  api = "http://127.0.0.1:8000/api/tasks/";

  constructor(private http: HttpClient) {}

  getFeed() {
    return this.http.get(this.api + "feed/");
  }

  createTask(data: any) {
    return this.http.post(this.api + "create/", data);
  }

  getMyTasks() {
    return this.http.get(this.api + "mytasks/");
  }

  updateTask(taskId: number, data: any) {
    return this.http.patch(this.api + `update/${taskId}/`, data);
  }

  completeTask(taskId: number) {
    return this.http.post(this.api + `complete/${taskId}/`, {});
  }

  deleteTask(taskId: number) {
    return this.http.delete(this.api + `delete/${taskId}/`);
  }
}
