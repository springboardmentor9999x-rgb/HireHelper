import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
    // Steps: 1 = email, 2 = OTP, 3 = new password
    currentStep = signal(1);
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    showPassword = signal(false);
    showConfirmPassword = signal(false);

    emailForm: FormGroup;
    otpForm: FormGroup;
    passwordForm: FormGroup;

    private emailValue = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.emailForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
        });
        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
        });
        this.passwordForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        });
    }

    get email() { return this.emailForm.get('email')!; }
    get otp() { return this.otpForm.get('otp')!; }
    get newPassword() { return this.passwordForm.get('newPassword')!; }
    get confirmPassword() { return this.passwordForm.get('confirmPassword')!; }

    togglePassword(): void { this.showPassword.update(v => !v); }
    toggleConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

    onSendOtp(): void {
        if (this.emailForm.invalid) {
            this.emailForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.emailValue = this.emailForm.value.email;

        this.authService.forgotPassword(this.emailValue).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.successMessage.set('A reset code has been sent to your email.');
                this.currentStep.set(2);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Failed to send reset code. Try again.');
            }
        });
    }

    onVerifyAndReset(): void {
        if (this.otpForm.invalid) {
            this.otpForm.markAllAsTouched();
            return;
        }
        this.errorMessage.set('');
        this.currentStep.set(3);
    }

    onResetPassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const { newPassword, confirmPassword } = this.passwordForm.value;
        if (newPassword !== confirmPassword) {
            this.errorMessage.set('Passwords do not match.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        const otpValue = this.otpForm.value.otp;

        this.authService.resetPassword(this.emailValue, otpValue, newPassword).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                this.successMessage.set(res.message);
                this.currentStep.set(4); // success state
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Failed to reset password. Try again.');
                // Go back to OTP step if OTP is invalid
                if (err.error?.message?.toLowerCase().includes('otp')) {
                    this.currentStep.set(2);
                }
            }
        });
    }
}