import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const credentials = {
      email: this.f['email'].value,
      password: this.f['password'].value,
    };

    this.authService.login(credentials).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        if (response.success && response.token) {
          // Token is stored automatically in auth service via tap()
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Login failed. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        // Extract specific error messages
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please check and try again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Your email is not verified. Please verify your email first.';
        } else if (error.status === 0) {
          this.errorMessage = 'Connection error. Please check your internet and try again.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
        console.error('Login error:', error);
      },
    });
  }
}