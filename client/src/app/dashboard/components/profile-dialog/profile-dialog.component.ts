import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../../services/user.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})
export class ProfileDialogComponent implements OnInit {
  private userService = inject(UserService);

  @Input() userId!: number;
  @Output() close = new EventEmitter<void>();

  profile: UserProfile | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loading = true;
    this.userService.getUserProfile(this.userId).subscribe({
      next: (res: { success: boolean; profile: UserProfile }) => {
        if (res.success) {
          this.profile = res.profile;
        } else {
          this.error = 'Failed to load profile';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching profile', err);
        this.error = 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
