import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    get email() { return this.loginForm.get('email')!; }
    get password() { return this.loginForm.get('password')!; }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (res) => {
                this.authService.saveSession(res.token, res.user);
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(
                    err.error?.message || 'Login failed. Please try again.'
                );
            }
        });
    }
}
`   `