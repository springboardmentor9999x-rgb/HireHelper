import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  first_name = '';
  last_name = '';
  email = '';
  password = '';
  number = '';
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private location: Location
  ) {}

  onNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    this.number = value;
    input.value = value;
  }

  registerUser() {
    if (!this.first_name || !this.last_name || !this.email || !this.password || !this.number) {
      this.errorMsg = 'All fields are required';
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(this.number.trim())) {
      this.errorMsg = 'Please enter a valid 10-digit mobile number';
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^_+\-])[A-Za-z\d@$!%*?&.#^_+\-]{8,}$/;

    if (!passwordRegex.test(this.password)) {
      this.errorMsg =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
      return;
    }

    const user = {
      first_name: this.first_name.trim(),
      last_name: this.last_name.trim(),
      email: this.email.trim(),
      password: this.password,
      number: this.number.trim()
    };

    this.auth.register(user).subscribe({
      next: () => {
        this.errorMsg = '';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Server Error';
      }
    });
  }
  onEmailInput(event: Event) {
  const input = event.target as HTMLInputElement;

  // spaces remove karo
  let value = input.value.replace(/\s/g, '');

  this.email = value;
  input.value = value;
}

  goBack() {
    this.location.back();
  }
}