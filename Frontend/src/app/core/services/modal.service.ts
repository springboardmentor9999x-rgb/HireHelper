import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalState = new BehaviorSubject<ModalData | null>(null);
  public modalState$ = this.modalState.asObservable();

  show(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.modalState.next({ title, message, type });
  }

  close() {
    this.modalState.next(null);
  }
}
