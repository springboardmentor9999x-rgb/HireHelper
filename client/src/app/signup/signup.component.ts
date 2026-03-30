import { Component, signal, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (!password || !confirm) return null;
    return password.value === confirm.value ? null : { passwordMismatch: true };
}

type Step = 'form' | 'email-otp' | 'phone-otp';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.css'
})
export class SignupComponent {
    signupForm: FormGroup;
    emailOtpForm: FormGroup;
    phoneOtpForm: FormGroup;

    currentStep = signal<Step>('form');
    isLoading = signal(false);
    errorMessage = signal('');
    successMsg = signal('');

    showPassword = signal(false);
    showConfirmPassword = signal(false);

    // Resend countdown
    resendCountdown = signal(0);
    private countdownInterval: ReturnType<typeof setInterval> | null = null;

    // Stored values for OTP steps
    pendingEmail = '';
    pendingPhone = '';
    private pendingData: { name: string; email: string; password: string; phone: string } | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-().]{7,20}$/)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required],
        }, { validators: passwordMatchValidator });

        this.emailOtpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });

        this.phoneOtpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });
    }

    togglePassword(): void { this.showPassword.update(v => !v); }
    toggleConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

    get name() { return this.signupForm.get('name')!; }
    get email() { return this.signupForm.get('email')!; }
    get phone() { return this.signupForm.get('phone')!; }
    get password() { return this.signupForm.get('password')!; }
    get confirmPassword() { return this.signupForm.get('confirmPassword')!; }
    get passwordMismatch() {
        return this.signupForm.errors?.['passwordMismatch'] && this.confirmPassword.touched;
    }

    // ── Step 1: Submit form → send email OTP ──────────────────────────────────
    onSubmit(): void {
        if (this.signupForm.invalid) { this.signupForm.markAllAsTouched(); return; }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const { name, email, password, phone } = this.signupForm.value;
        this.pendingData = { name, email, password, phone };
        this.pendingEmail = email;
        this.pendingPhone = phone;

        this.authService.sendEmailOtp(email).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.currentStep.set('email-otp');
                this.startCountdown();
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Failed to send email OTP.');
            }
        });
    }

    // ── Step 2: Verify email OTP → send phone OTP ────────────────────────────
    verifyEmailOtp(): void {
        if (this.emailOtpForm.invalid) { this.emailOtpForm.markAllAsTouched(); return; }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const { otp } = this.emailOtpForm.value;

        this.authService.verifyEmailOtp(this.pendingEmail, otp).subscribe({
            next: () => {
                // Now send phone OTP
                this.authService.sendPhoneOtp(this.pendingPhone).subscribe({
                    next: () => {
                        this.isLoading.set(false);
                        this.emailOtpForm.reset();
                        this.currentStep.set('phone-otp');
                        this.startCountdown();
                    },
                    error: (err) => {
                        this.isLoading.set(false);
                        this.errorMessage.set(err.error?.message || 'Failed to send phone OTP.');
                    }
                });
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Invalid email OTP.');
            }
        });
    }

    // ── Step 3: Verify phone OTP → register ──────────────────────────────────
    verifyPhoneOtp(): void {
        if (this.phoneOtpForm.invalid) { this.phoneOtpForm.markAllAsTouched(); return; }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const { otp } = this.phoneOtpForm.value;

        this.authService.verifyPhoneOtp(this.pendingPhone, otp).subscribe({
            next: () => {
                // Both OTPs verified — create the account
                const d = this.pendingData!;
                this.authService.register(d.name, d.email, d.password, d.phone).subscribe({
                    next: (res) => {
                        this.authService.saveSession(res.token, res.user);
                        this.isLoading.set(false);
                        this.router.navigate(['/dashboard']);
                    },
                    error: (err) => {
                        this.isLoading.set(false);
                        this.errorMessage.set(err.error?.message || 'Registration failed.');
                    }
                });
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Invalid phone OTP.');
            }
        });
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    resendEmailOtp(): void {
        if (this.resendCountdown() > 0) return;
        this.errorMessage.set('');
        this.authService.sendEmailOtp(this.pendingEmail).subscribe({
            next: () => { this.successMsg.set('OTP resent!'); this.startCountdown(); },
            error: (err) => { this.errorMessage.set(err.error?.message || 'Failed to resend.'); }
        });
    }

    resendPhoneOtp(): void {
        if (this.resendCountdown() > 0) return;
        this.errorMessage.set('');
        this.authService.sendPhoneOtp(this.pendingPhone).subscribe({
            next: () => { this.successMsg.set('OTP resent!'); this.startCountdown(); },
            error: (err) => { this.errorMessage.set(err.error?.message || 'Failed to resend.'); }
        });
    }

    private startCountdown(seconds = 30): void {
        this.successMsg.set('');
        this.stopCountdown();
        this.resendCountdown.set(seconds);
        this.countdownInterval = setInterval(() => {
            const v = this.resendCountdown() - 1;
            this.resendCountdown.set(v);
            if (v <= 0) this.stopCountdown();
        }, 1000);
    }

    private stopCountdown(): void {
        if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    }

    goBack(): void {
        this.stopCountdown();
        this.errorMessage.set('');
        if (this.currentStep() === 'phone-otp') {
            this.phoneOtpForm.reset();
            this.currentStep.set('email-otp');
            this.startCountdown();
        } else {
            this.emailOtpForm.reset();
            this.currentStep.set('form');
        }
    }
}
