import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../services/review';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
<div *ngIf="isOpen" class="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300" (click)="close()">
  <div class="w-full max-w-xl bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" (click)="$event.stopPropagation()">
    
    <!-- Header -->
    <div class="p-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between shrink-0">
      <div>
        <h2 class="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">{{ userName || 'User Profile' }}</h2>
        <div class="flex items-center gap-2 mt-1.5">
          <span *ngIf="userRating" class="px-2.5 py-0.5 rounded-full bg-yellow-100/50 border border-yellow-200 text-yellow-600 text-sm font-semibold shadow-sm flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {{ userRating }} Average</span>
          <span *ngIf="!userRating" class="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-sm font-semibold shadow-sm">New User</span>
          <span class="text-sm font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full shadow-sm">{{ reviews.length }} Reviews</span>
        </div>
      </div>
      <button type="button" (click)="close()" class="w-10 h-10 rounded-full bg-slate-100 shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Body / Review List -->
    <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50">
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16 gap-4 text-blue-500">
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <p class="text-sm font-medium text-slate-500 tracking-wide">Loading reviews...</p>
      </div>

      <div *ngIf="!loading && reviews.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3.5 3.5"/><path d="M20.3 20.3 8.2 8.2"/><circle cx="11" cy="11" r="8"/></svg>
        </div>
        <h3 class="text-lg font-bold text-slate-700 mb-1">No Reviews Yet</h3>
        <p class="text-sm text-slate-500">This user hasn't received any reviews.</p>
      </div>

      <div *ngIf="!loading && reviews.length > 0" class="space-y-4">
        <article *ngFor="let review of reviews" class="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="font-bold text-slate-800 flex items-center gap-1.5">
                {{ review.reviewer_name }}
              </p>
              <p class="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Task: {{ review.task_title }}</p>
            </div>
            <span class="text-yellow-600 text-xs font-black shrink-0 bg-gradient-to-r from-yellow-50 to-orange-50 px-2.5 py-1 rounded-lg border border-yellow-200/60 shadow-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {{ review.rating }}/5
            </span>
          </div>
          
          <p class="text-slate-600 text-[15px] leading-relaxed mt-2 italic bg-slate-50/50 p-4 rounded-xl border border-slate-100/60" *ngIf="review.comment">
            "{{ review.comment }}"
          </p>
          <div class="text-xs font-semibold text-slate-400 mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {{ formatDate(review.created_at) }}</span>
          </div>
        </article>
      </div>
    </div>
  </div>
</div>
  `
})
export class ProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() userId: number | null = null;
  @Input() userName: string = '';
  @Input() userRating: number | string | null = null;
  
  @Output() closeEvent = new EventEmitter<void>();

  reviews: any[] = [];
  loading = false;

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.checkLoad();
  }

  ngOnChanges() {
    this.checkLoad();
  }

  private checkLoad() {
    if (this.isOpen && this.userId) {
      this.loadReviews();
    } else {
      this.reviews = [];
    }
  }

  loadReviews() {
    if (!this.userId) return;
    this.loading = true;
    this.reviewService.getUserReviews(this.userId).subscribe(
      (data) => {
        this.reviews = data;
        this.loading = false;
      },
      () => {
        this.loading = false;
      }
    );
  }

  close() {
    this.isOpen = false;
    this.closeEvent.emit();
  }

  formatDate(val: string) {
    if (!val) return '';
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
