import { Component, inject, ChangeDetectorRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

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

    // Notification state
    notificationsEnabled = false;
    notificationPermission: NotificationPermission = 'default';
    notificationToggling = false;

    userInitial = '';
    userName = '';

    constructor() {
        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });

        const user = this.authService.getUser();
        this.profileForm = this.fb.group({
            name: [user?.name || '', [Validators.required]]
        });
        this.userName = user?.name || '';
        this.userInitial = this.userName.charAt(0).toUpperCase();
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

    onChangePassword() {
        if (this.passwordForm.invalid) return;
        this.isSubmittingPassword = true;
        this.passwordMessage = '';
        const { currentPassword, newPassword } = this.passwordForm.value;

        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: (res) => {
                this.passwordSuccess = true;
                this.passwordMessage = res.message;
                this.passwordForm.reset();
                this.isSubmittingPassword = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.passwordSuccess = false;
                this.passwordMessage = err.error?.message || 'Error updating password';
                this.isSubmittingPassword = false;
                this.cdr.detectChanges();
            }
        });
    }

    onUpdateProfile() {
        if (this.profileForm.invalid) return;
        this.isSubmittingProfile = true;
        this.profileMessage = '';
        const { name } = this.profileForm.value;

        this.authService.updateProfile(name).subscribe({
            next: (res) => {
                this.profileSuccess = true;
                this.profileMessage = res.message;
                this.userName = res.name;
                this.userInitial = res.name.charAt(0).toUpperCase();

                const user = this.authService.getUser();
                if (user) {
                    user.name = res.name;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                this.isSubmittingProfile = false;
                this.cdr.detectChanges();
                setTimeout(() => window.location.reload(), 1500);
            },
            error: (err) => {
                this.profileSuccess = false;
                this.profileMessage = err.error?.message || 'Error updating profile';
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
