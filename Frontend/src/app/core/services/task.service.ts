import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  pay?: string;
  picture?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/api/tasks`;

  constructor(private http: HttpClient) { }

  getTaskImageFallback(title: string, id: any): string {
    const titleLower = (title || '').toLowerCase();
    let keyword = 'work,task';
    
    if (titleLower.includes('clean') || titleLower.includes('wash') || titleLower.includes('sweep') || titleLower.includes('dust')) {
      keyword = 'cleaning,house';
    } else if (titleLower.includes('move') || titleLower.includes('pack') || titleLower.includes('deliver') || titleLower.includes('box')) {
      keyword = 'moving,boxes';
    } else if (titleLower.includes('fix') || titleLower.includes('repair') || titleLower.includes('assemble') || titleLower.includes('build') || titleLower.includes('plumb') || titleLower.includes('electric') || titleLower.includes('install')) {
      keyword = 'tools,repair';
    } else if (titleLower.includes('cook') || titleLower.includes('bake') || titleLower.includes('food') || titleLower.includes('chef')) {
      keyword = 'cooking,food';
    } else if (titleLower.includes('garden') || titleLower.includes('yard') || titleLower.includes('plant') || titleLower.includes('lawn') || titleLower.includes('tree') || titleLower.includes('mow')) {
      keyword = 'garden,lawn';
    } else if (titleLower.includes('teach') || titleLower.includes('tutor') || titleLower.includes('math') || titleLower.includes('science') || titleLower.includes('language') || titleLower.includes('lesson')) {
      keyword = 'studying,books';
    } else if (titleLower.includes('code') || titleLower.includes('design') || titleLower.includes('software') || titleLower.includes('computer') || titleLower.includes('tech') || titleLower.includes('website')) {
      keyword = 'coding,computer';
    } else if (titleLower.includes('pet') || titleLower.includes('dog') || titleLower.includes('cat') || titleLower.includes('walk')) {
      keyword = 'pets,dog';
    } else if (titleLower.includes('event') || titleLower.includes('party') || titleLower.includes('wedding') || titleLower.includes('photo')) {
      keyword = 'event,party';
    } else if (titleLower.includes('shop') || titleLower.includes('buy') || titleLower.includes('grocer') || titleLower.includes('errand')) {
      keyword = 'shopping,grocery';
    }
    
    let hash = 0;
    if (id) {
       hash = typeof id === 'number' ? id : parseInt(id as string, 10) || 0;
    } 
    if (!hash && title) {
       for(let i=0; i<title.length; i++) hash += title.charCodeAt(i);
    }
    const seed = Math.abs(hash) || 1;
    
    // Using loremflickr for reliable topical placeholders
    return `https://loremflickr.com/800/500/${keyword}?lock=${seed % 1000}`;
  }

  resolveTaskImage(task: any): string {
    if (task && task.picture && task.picture.trim() !== '') {
      if (task.picture.startsWith('http') || task.picture.startsWith('data:')) {
         return task.picture;
      }
      return `${environment.apiUrl}${task.picture.startsWith('/') ? '' : '/'}${task.picture}`;
    }
    return this.getTaskImageFallback(task?.title, task?.id);
  }

  addTask(taskData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, taskData);
  }

  getMyTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/my`);
  }

  getFeedTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}`);
  }

  requestTask(task_id: string, message: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, { task_id, message });
  }

  getIncomingRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/incoming-requests`);
  }

  getMyAppliedTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-applied`);
  }

  updateRequestStatus(request_id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/request/${request_id}`, { status });
  }

  replyToRequest(request_id: string, reply_message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request/${request_id}/reply`, { reply_message });
  }

  markMessagesAsRead(request_id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/request/${request_id}/read-messages`, {});
  }

  deleteRequest(request_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/request/${request_id}`);
  }

  updateTask(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleTaskStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }
}
