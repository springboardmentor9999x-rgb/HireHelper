import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {
    first_name: '',
    last_name: '',
    email_id: '',
    phone_number: '',
    profile_picture: ''
  };

  isEditing = false;
  selectedFile: File | null = null;
  passwordInput = '';
  confirmPasswordInput = '';
  apiUrl = environment.apiUrl;
  labels: any = {};

  professionalDetails = {
    skills: 'Web Development, UI/UX Design',
    hourlyRate: 50,
    availability: 'Available for work',
    portfolioUrl: 'https://myportfolio.com'
  };

  constructor(
    private authService: AuthService,
    private langService: LanguageService,
    private modalService: ModalService
  ) {}

  get passwordMismatch(): boolean {
    if (!this.passwordInput && !this.confirmPasswordInput) return false;
    return this.passwordInput !== this.confirmPasswordInput;
  }

  ngOnInit(): void {
    this.langService.lang$.subscribe(() => {
      this.labels = this.langService.getLabels();
    });
    this.fetchProfile();
    const storedProfDetails = localStorage.getItem('professionalDetails');
    if (storedProfDetails) {
      this.professionalDetails = JSON.parse(storedProfDetails);
    }
  }

  fetchProfile(): void {
    this.authService.getMe().subscribe({
      next: (data) => {
        this.user = data;
        localStorage.setItem('user', JSON.stringify(data));
      },
      error: (err) => console.error(err)
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.fetchProfile();
      this.selectedFile = null;
      this.passwordInput = '';
      this.confirmPasswordInput = '';
      const storedProfDetails = localStorage.getItem('professionalDetails');
      if (storedProfDetails) {
        this.professionalDetails = JSON.parse(storedProfDetails);
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  saveProfile() {
    if (this.passwordMismatch) {
      this.modalService.show('Error', this.labels.passwordMismatch || 'Passwords do not match!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('first_name', this.user.first_name);
    formData.append('last_name', this.user.last_name);
    formData.append('email_id', this.user.email_id);
    if (this.user.phone_number) formData.append('phone_number', this.user.phone_number);
    if (this.passwordInput && !this.passwordMismatch) formData.append('password', this.passwordInput);
    if (this.selectedFile) formData.append('profile_picture', this.selectedFile);

    this.authService.updateProfile(formData).subscribe({
      next: (res) => {
        this.user = res;
        this.isEditing = false;
        this.passwordInput = '';
        this.confirmPasswordInput = '';
        this.selectedFile = null;
        localStorage.setItem('professionalDetails', JSON.stringify(this.professionalDetails));
        this.modalService.show('Success', 'Profile updated successfully!', 'success');
      },
      error: (err) => {
        console.error(err);
        this.modalService.show('Error', 'Failed to update profile.', 'error');
      }
    });
  }
}
