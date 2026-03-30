import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ActivityStats } from '../../../services/profile.service';

@Component({
  selector: 'app-activity-dashboard',
  templateUrl: './activity-dashboard.html',
  styleUrls: ['./activity-dashboard.css'],
  standalone: true,
  imports: [CommonModule],
})
export class ActivityDashboardComponent implements OnInit {
  activity: ActivityStats | null = null;
  loading = false;
  errorMessage = '';

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadActivity();
  }

  /**
   * Load user activity statistics
   */
  loadActivity() {
    this.loading = true;
    this.errorMessage = '';

    this.profileService.getActivity().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.activity = response.data;
        } else {
          this.errorMessage = 'Failed to load activity';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading activity:', error);
        this.errorMessage = error.error?.message || 'Failed to load activity';
      },
    });
  }

  /**
   * Get percentage for progress bar
   */
  getActivityPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
}
