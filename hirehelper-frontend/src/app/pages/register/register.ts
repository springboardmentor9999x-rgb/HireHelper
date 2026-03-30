import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  protected firstName = '';
  protected lastName = '';
  protected emailId = '';
  protected phoneNumber = '';
  protected password = '';
  protected confirmPassword = '';
  protected role = 'user';
  protected isLoading = signal(false);
  private toastService = inject(ToastService);

  // Field-level error signals
  protected firstNameError = signal('');
  protected lastNameError = signal('');
  protected emailError = signal('');
  protected phoneError = signal('');
  protected passwordError = signal('');
  protected confirmPasswordError = signal('');

  constructor(private authService: AuthService, private router: Router) { }

  // --- Validators ---

  validateFirstName(): boolean {
    const val = this.firstName.trim();
    if (!val) { this.firstNameError.set('First name is required.'); return false; }
    if (val.length < 2) { this.firstNameError.set('Must be at least 2 characters.'); return false; }
    if (!/^[a-zA-Z\s'-]+$/.test(val)) { this.firstNameError.set('Only letters, spaces, hyphens, and apostrophes allowed.'); return false; }
    this.firstNameError.set(''); return true;
  }

  validateLastName(): boolean {
    const val = this.lastName.trim();
    if (!val) { this.lastNameError.set('Last name is required.'); return false; }
    if (val.length < 2) { this.lastNameError.set('Must be at least 2 characters.'); return false; }
    if (!/^[a-zA-Z\s'-]+$/.test(val)) { this.lastNameError.set('Only letters, spaces, hyphens, and apostrophes allowed.'); return false; }
    this.lastNameError.set(''); return true;
  }

  validateEmail(): boolean {
    const val = this.emailId.trim();
    if (!val) { this.emailError.set('Email is required.'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) { this.emailError.set('Please enter a valid email address.'); return false; }
    this.emailError.set(''); return true;
  }

  validatePhone(): boolean {
    const val = this.phoneNumber.trim();
    if (!val) { this.phoneError.set('Phone number is required.'); return false; }
    // Accepts optional +, then 7-15 digits with optional spaces/dashes
    const phoneRegex = /^\+?[\d\s\-]{7,15}$/;
    if (!phoneRegex.test(val)) { this.phoneError.set('Enter a valid phone number (7-15 digits).'); return false; }
    this.phoneError.set(''); return true;
  }

  validatePassword(): boolean {
    const val = this.password;
    if (!val) { this.passwordError.set('Password is required.'); return false; }
    if (val.length < 8) { this.passwordError.set('Password must be at least 8 characters.'); return false; }
    if (!/[A-Z]/.test(val)) { this.passwordError.set('Must contain at least one uppercase letter.'); return false; }
    if (!/[a-z]/.test(val)) { this.passwordError.set('Must contain at least one lowercase letter.'); return false; }
    if (!/[0-9]/.test(val)) { this.passwordError.set('Must contain at least one number.'); return false; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) { this.passwordError.set('Must contain at least one special character.'); return false; }
    this.passwordError.set(''); return true;
  }

  validateConfirmPassword(): boolean {
    if (!this.confirmPassword) { this.confirmPasswordError.set('Please confirm your password.'); return false; }
    if (this.password !== this.confirmPassword) { this.confirmPasswordError.set('Passwords do not match.'); return false; }
    this.confirmPasswordError.set(''); return true;
  }

  // Password strength (for UI indicator)
  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score++;
    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score === 3) return { score, label: 'Fair', color: '#f97316' };
    if (score === 4) return { score, label: 'Good', color: '#22c55e' };
    return { score, label: 'Strong', color: '#16a34a' };
  }

  onSubmit() {
    // Run all validators (run each so all field errors show at once)
    const v1 = this.validateFirstName();
    const v2 = this.validateLastName();
    const v3 = this.validateEmail();
    const v4 = this.validatePhone();
    const v5 = this.validatePassword();
    const v6 = this.validateConfirmPassword();
    const valid = v1 && v2 && v3 && v4 && v5 && v6;

    if (!valid) return;

    this.isLoading.set(true);

    const userData = {
      first_name: this.firstName.trim(),
      last_name: this.lastName.trim(),
      email_id: this.emailId.trim().toLowerCase(),
      phone_number: this.phoneNumber.trim(),
      password: this.password,
      role: this.role
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.showSuccess('Registration successful! Check your email for OTP.');
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.emailId.trim().toLowerCase() } });
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
