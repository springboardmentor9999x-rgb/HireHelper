import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService, RatingData } from '../../../services/rating.service';

@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-dialog.component.html',
  styleUrls: ['./rating-dialog.component.css']
})
export class RatingDialogComponent {
  private ratingService = inject(RatingService);

  @Input() taskId!: number;
  @Input() taskTitle!: string;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  score = 0;
  hoverScore = 0;
  comment = '';
  submitting = false;
  error: string | null = null;

  setScore(s: number): void {
    this.score = s;
  }

  onHover(s: number): void {
    this.hoverScore = s;
  }

  onLeave(): void {
    this.hoverScore = 0;
  }

  onSubmit(): void {
    if (this.score === 0) {
      this.error = 'Please select a rating';
      return;
    }

    this.submitting = true;
    this.error = null;

    this.ratingService.submitRating({
      taskId: this.taskId,
      score: this.score,
      comment: this.comment
    }).subscribe({
      next: (res: { success: boolean; message: string }) => {
        if (res.success) {
          this.submitted.emit();
          this.onClose();
        } else {
          this.error = res.message || 'Failed to submit rating';
        }
        this.submitting = false;
      },
      error: (err: any) => {
        console.error('Error submitting rating', err);
        this.error = 'Failed to submit rating. Please try again.';
        this.submitting = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
