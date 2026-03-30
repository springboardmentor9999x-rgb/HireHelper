import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.css']
})
export class RequestModalComponent {
  @Input() isOpen = false;
  @Input() taskTitle = '';
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  message = '';

  onConfirm() {
    this.confirm.emit(this.message);
    this.message = '';
    this.isOpen = false;
  }

  onCancel() {
    this.cancel.emit();
    this.message = '';
    this.isOpen = false;
  }
}
