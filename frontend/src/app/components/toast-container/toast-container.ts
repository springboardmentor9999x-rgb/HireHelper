import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  getTypeClass(type: ToastType): string {
    const classes: Record<ToastType, string> = {
      success: 'toast-success',
      error: 'toast-error',
      info: 'toast-info',
      warning: 'toast-warning',
    };

    return classes[type];
  }
}
