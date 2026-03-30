import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Request {
  id: string;
  task_id: string;
  requester_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  updated_at?: string;
}

export interface MyRequest extends Request {
  title: string;
  location: string;
  task_owner_id: string;
  task_owner_name: string;
}

export interface ReceivedRequest extends Request {
  title: string;
  location: string;
  task_status?: string;
  requester_first_name: string;
  requester_last_name: string;
  requester_email: string;
}

export interface SendRequestBody {
  task_id: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  count?: number;
}

/**
 * Request Service
 * Handles all request-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private baseUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  /**
   * Send a request for a task
   * POST /api/requests
   */
  sendRequest(taskId: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      this.baseUrl,
      { task_id: taskId }
    );
  }

  /**
   * Get all requests sent by logged user
   * GET /api/requests/my
   */
  getMyRequests(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/my`);
  }

  /**
   * Get all requests received for user's tasks
   * GET /api/requests/received
   */
  getReceivedRequests(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/received`);
  }

  /**
   * Get request details
   * GET /api/requests/:id
   */
  getRequestById(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Accept a request
   * PUT /api/requests/:id/accept
   */
  acceptRequest(id: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/${id}/accept`, {});
  }

  /**
   * Reject a request
   * PUT /api/requests/:id/reject
   */
  rejectRequest(id: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/${id}/reject`, {});
  }

  /**
   * Cancel a request (delete)
   * DELETE /api/requests/:id
   */
  cancelRequest(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`);
  }
}
