import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

export interface OfferItem {
  id: string;
  title: string;
  details: string;
  discount: number;
  expiresOn: string;
  createdAt: string;
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, WorkspaceHeaderComponent],
  templateUrl: './offers.html',
  styleUrls: ['./offers.css']
})
export class OffersComponent implements OnInit {
  offers: OfferItem[] = [];
  submitting = false;

  offerForm;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private auth: AuthService
  ) {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      details: ['', [Validators.required, Validators.maxLength(600)]],
      discount: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      expiresOn: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadOffers();
  }

  get f() {
    return this.offerForm.controls;
  }

  createOffer(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorAlert('Unable to identify logged in user. Please login again.');
      return;
    }

    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const value = this.offerForm.value;
    const nextOffer: OfferItem = {
      id: crypto.randomUUID(),
      title: (value.title ?? '').trim(),
      details: (value.details ?? '').trim(),
      discount: Number(value.discount),
      expiresOn: value.expiresOn ?? '',
      createdAt: new Date().toISOString()
    };

    this.offers = [nextOffer, ...this.offers];
    this.persistOffers(userId);
    this.taskService.addLocalNotification(
      `Offer created: "${nextOffer.title}" with ${nextOffer.discount}% off.`
    );

    this.submitting = false;
    this.offerForm.reset();

    Swal.fire({
      icon: 'success',
      title: 'Offer Created',
      text: 'Your offer has been added successfully.',
      confirmButtonColor: '#2563eb'
    });
  }

  removeOffer(offerId: string): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorAlert('Unable to identify logged in user. Please login again.');
      return;
    }

    this.offers = this.offers.filter((offer) => offer.id !== offerId);
    this.persistOffers(userId);
  }

  private loadOffers(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.offers = [];
      return;
    }

    this.offers = this.taskService.getStoredOffersForUser<OfferItem>(userId);
  }

  private persistOffers(userId: string): void {
    this.taskService.saveOffersForUser<OfferItem>(userId, this.offers);
  }

  private getCurrentUserId(): string | null {
    return this.auth.getStoredUser()?.id || null;
  }

  private errorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Action Failed',
      text: message,
      confirmButtonColor: '#dc2626'
    });
  }
}
