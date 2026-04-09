import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { ToastService } from '../../../services/toast.service';

const API_URL = 'http://localhost:5000/api/auth';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    notificationService = inject(NotificationService);

    // Tab state
    activeTab: 'profile' | 'security' | 'notifications' = 'profile';

    // Change Password Form
    passwordForm: FormGroup;
    isSubmittingPassword = false;
    passwordMessage = '';
    passwordSuccess = false;
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;

    // Profile Form
    profileForm: FormGroup;
    isSubmittingProfile = false;
    profileMessage = '';
    profileSuccess = false;

    // Avatar upload
    avatarPreview: string | null = null;
    selectedAvatarFile: File | null = null;
    isUploadingAvatar = false;
    avatarMessage = '';
    avatarSuccess = false;

    // Notification state
    notificationsEnabled = false;
    notificationPermission: NotificationPermission = 'default';
    notificationToggling = false;

    userInitial = '';
    userName = '';
    userPicture: string | null = null;

    constructor() {
        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });

        const user = this.authService.getUser() as any;
        this.profileForm = this.fb.group({
            name: [user?.name || '', [Validators.required]],
            bio: [user?.bio || '', [Validators.maxLength(500)]]
        });
        this.userName = user?.name || '';
        this.userInitial = this.userName.charAt(0).toUpperCase();
        
        if (user?.picture_url) {
            this.userPicture = user.picture_url;
            this.avatarPreview = this.userPicture;
        }
    }

    ngOnInit() {
        this.notificationsEnabled = this.notificationService.isEnabled;
        this.notificationPermission = this.notificationService.permissionStatus;
    }

    setTab(tab: 'profile' | 'security' | 'notifications') {
        this.activeTab = tab;
    }

    private passwordMatchValidator(g: FormGroup) {
        const newPass = g.get('newPassword')?.value;
        const confirmPass = g.get('confirmPassword')?.value;
        return newPass === confirmPass ? null : { mismatch: true };
    }

    onAvatarFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];

        // Validate type & size client-side
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            this.avatarMessage = 'Only JPEG, PNG, or WebP images allowed.';
            this.avatarSuccess = false;
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            this.avatarMessage = 'File size must be under 5 MB.';
            this.avatarSuccess = false;
            return;
        }

        this.selectedAvatarFile = file;
        this.avatarMessage = '';
        const reader = new FileReader();
        reader.onload = (e) => {
            this.avatarPreview = e.target?.result as string;
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
    }

    onUploadAvatar() {
        if (!this.selectedAvatarFile) return;
        this.isUploadingAvatar = true;
        this.avatarMessage = '';

        this.authService.uploadProfilePicture(this.selectedAvatarFile).subscribe({
            next: (res) => {
                this.toastService.success('Profile picture updated successfully!');
                this.selectedAvatarFile = null;
                this.isUploadingAvatar = false;

                const user = this.authService.getUser() as any;
                if (user) {
                    user.picture_url = res.picture_url;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                
                this.userPicture = `${res.picture_url}?t=${Date.now()}`;
                this.avatarPreview = this.userPicture;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Upload failed. Please try again.');
                this.isUploadingAvatar = false;
                this.cdr.detectChanges();
            }
        });
    }

    onChangePassword() {
        if (this.passwordForm.invalid) return;
        this.isSubmittingPassword = true;
        this.passwordMessage = '';
        const { currentPassword, newPassword } = this.passwordForm.value;

        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: (res) => {
                this.toastService.success('Password updated successfully!');
                this.passwordForm.reset();
                this.isSubmittingPassword = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Error updating password');
                this.isSubmittingPassword = false;
                this.cdr.detectChanges();
            }
        });
    }

    onUpdateProfile() {
        if (this.profileForm.invalid) return;
        this.isSubmittingProfile = true;
        this.profileMessage = '';
        const { name, bio } = this.profileForm.value;

        this.authService.updateProfile(name, bio).subscribe({
            next: (res) => {
                this.toastService.success('Profile updated successfully!');
                this.userName = res.name;
                this.userInitial = res.name.charAt(0).toUpperCase();

                const user = this.authService.getUser() as any;
                if (user) {
                    user.name = res.name;
                    user.bio = res.bio;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                this.isSubmittingProfile = false;
                this.cdr.detectChanges();
                setTimeout(() => window.location.reload(), 1500);
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Error updating profile');
                this.isSubmittingProfile = false;
                this.cdr.detectChanges();
            }
        });
    }

    async toggleNotifications() {
        this.notificationToggling = true;
        if (this.notificationsEnabled) {
            this.notificationService.disable();
            this.notificationsEnabled = false;
        } else {
            const granted = await this.notificationService.enable();
            this.notificationsEnabled = granted;
            if (!granted) {
                this.notificationPermission = this.notificationService.permissionStatus;
            }
        }
        this.notificationPermission = this.notificationService.permissionStatus;
        this.notificationToggling = false;
        this.cdr.detectChanges();
    }
}
