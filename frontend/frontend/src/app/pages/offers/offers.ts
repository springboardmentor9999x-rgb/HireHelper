import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { WorkspaceHeaderComponent } from '../../components/workspace-header/workspace-header';
import { TaskService } from '../../services/task.service';

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
  private readonly offersStorageKey = 'hirehelper_offers';

  offers: OfferItem[] = [];
  submitting = false;

  offerForm;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
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
    this.persistOffers();
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
    this.offers = this.offers.filter((offer) => offer.id !== offerId);
    this.persistOffers();
  }

  private loadOffers(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const raw = localStorage.getItem(this.offersStorageKey);
    if (!raw) {
      this.offers = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as OfferItem[];
      this.offers = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.offers = [];
      localStorage.removeItem(this.offersStorageKey);
    }
  }

  private persistOffers(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.offersStorageKey, JSON.stringify(this.offers));
  }
}
