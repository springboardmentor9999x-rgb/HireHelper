import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  api = 'http://127.0.0.1:8000/api/requests/';

  constructor(private http: HttpClient) {}

  getMyRequests() {
    return this.http.get(this.api + 'my/');
  }

  getIncomingRequests() {
    return this.http.get(this.api + 'received/');
  }

  acceptRequest(requestId: number) {
        return this.http.post(this.api + `accept/${requestId}/`, {});
  }

    sendRequest(taskId: number, message: string = '') {
      return this.http.post(this.api, { task_id: taskId, message });
    }

    updateMyRequest(requestId: number, message: string) {
      return this.http.patch(this.api + `${requestId}/`, { message });
    }

    replyToRequest(requestId: number, hirerReply: string) {
      return this.http.patch(this.api + `reply/${requestId}/`, { hirer_reply: hirerReply });
    }

    deleteMyRequest(requestId: number) {
      return this.http.delete(this.api + `${requestId}/`);
    }

    rejectRequest(requestId: number) {
      return this.http.post(this.api + `reject/${requestId}/`, {});
    }
}
