import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 0;

  get currentToasts() {
    return this.toasts.asReadonly();
  }

  showSuccess(message: string) {
    this.addToast(message, 'success');
  }

  showError(message: string) {
    this.addToast(message, 'error');
  }

  showInfo(message: string) {
    this.addToast(message, 'info');
  }

  private addToast(message: string, type: ToastType) {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  }

  dismiss(id: number) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
