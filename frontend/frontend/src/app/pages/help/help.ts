import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './help.html',
  styleUrls: ['./help.css']
})
export class HelpComponent {
  faqs = [
    {
      question: 'What is HireHelper?',
      answer: 'HireHelper is a task marketplace where hirers post local tasks and helpers can request to assist.'
    },
    {
      question: 'How can I see hirers posts?',
      answer: 'Open the Feed page from the sidebar to browse tasks posted by other users.'
    },
    {
      question: 'How can I request help on a task?',
      answer: 'On the Feed page, open a task card and click Request. You can track it later in My Requests.'
    },
    {
      question: 'Where can I manage tasks I posted?',
      answer: 'Use My Tasks to edit, close, reopen, or delete your own task posts.'
    },
    {
      question: 'How do I get notified about updates?',
      answer: 'Use the bell icon in the header or open Notifications from the sidebar for updates.'
    }
  ];

  supportForm;
  sending = false;

  constructor(private fb: FormBuilder) {
    this.supportForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      supportType: ['General', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,20}$/)]],
      subject: ['', [Validators.required, Validators.maxLength(150)]],
      message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1200)]]
    });
  }

  get f() {
    return this.supportForm.controls;
  }

  sendSupportRequest(): void {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.sending = true;

    setTimeout(() => {
      this.sending = false;
      Swal.fire({
        icon: 'success',
        title: 'Support Request Sent',
        text: 'Our support team has received your request and will contact you soon.',
        confirmButtonColor: '#2563eb'
      });
      this.supportForm.reset({ supportType: 'General' });
    }, 450);
  }
}
