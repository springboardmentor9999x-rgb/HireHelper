import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    last_name: ''
  };

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    const payload = {
      username: this.registerData.email.split('@')[0],
      first_name: this.registerData.name,
      last_name: this.registerData.last_name || '',
      email: this.registerData.email,
      password: this.registerData.password,
      role: this.registerData.role,
      phone_number: '',
      city: ''
    };

    this.auth.register(payload).subscribe(
      (res: any) => {
        localStorage.setItem('pendingOtpEmail', this.registerData.email);

        if (res?.otp) {
          this.toast.warning(`Email delivery failed. Use this OTP: ${res.otp}`, 4500);
        } else {
          this.toast.success('Registered successfully. OTP sent to your email.');
        }

        this.router.navigate(['/otp']);
      },
      (err) => {
        console.error('Registration error:', err);
        if (err.status === 0) {
          this.toast.error('Cannot connect to server. Make sure backend is running on port 8000.');
        } else {
          this.toast.error(JSON.stringify(err?.error || 'Registration failed'));
        }
      }
    );
  }
}
