import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
  duration: number;
  actions?: ToastAction[];
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();
  private toastCounter = 0;

  success(text: string, duration = 2800): void {
    this.show('success', text, duration);
  }

  error(text: string, duration = 3500): void {
    this.show('error', text, duration);
  }

  info(text: string, duration = 2500): void {
    this.show('info', text, duration);
  }

  warning(text: string, duration = 3000): void {
    this.show('warning', text, duration);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, text: string, duration: number, actions?: ToastAction[]): void {
    const id = ++this.toastCounter;
    const toast: ToastMessage = { id, type, text, duration, actions };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    if (!actions || actions.length === 0) {
      window.setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  confirm(text: string, actions: ToastAction[]): void {
    // Confirmation toasts stay until user acts
    this.show('info', text, 0, actions);
  }
}
