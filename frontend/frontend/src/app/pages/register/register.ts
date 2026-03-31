import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  first_name = '';
  last_name = '';
  email_id = '';
  password = '';
  phone_number = '';
  country_code = '+91';
  profile_picture = '';
  error = '';

  countryCodes = [
    { label: 'India (+91)', value: '+91' },
    { label: 'United States (+1)', value: '+1' },
    { label: 'United Kingdom (+44)', value: '+44' },
    { label: 'UAE (+971)', value: '+971' }
  ];

  constructor(private auth:AuthService, private router:Router){}

  onPhoneInput(value: string) {
    this.phone_number = (value || '').replace(/\D/g, '').slice(0, 10);
  }

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.profile_picture = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.profile_picture = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = () => {
      this.error = 'Failed to read selected image';
      this.profile_picture = '';
    };
    reader.readAsDataURL(file);
  }

  register(){
    this.error = '';

    const normalizedPhone = this.phone_number.replace(/\D/g, '');
    if (normalizedPhone.length !== 10) {
      this.error = 'Phone number must be exactly 10 digits';
      return;
    }

    const email = this.email_id.trim().toLowerCase();

    const data = {
      first_name:this.first_name,
      last_name:this.last_name,
      email_id:email,
      password:this.password,
      phone_number:`${this.country_code}${normalizedPhone}`,
      profile_picture: this.profile_picture || null
    };

    this.auth.register(data).subscribe({
      next:(res:any)=>{
        if (res?.alreadyExists) {
          alert('Account already exists. Please login with your email and password.');
          this.router.navigate(['/login']);
          return;
        }

        alert(res?.message || 'OTP sent to your email');
        this.router.navigate(['/verify-otp'],{
          queryParams:{ email }
        });
      },
      error:(err)=>{
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
