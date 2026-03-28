import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  api = 'http://127.0.0.1:8000/api/accounts/';

  constructor(private http: HttpClient) {}

  register(data: any) {
    return this.http.post(this.api + 'register/', data);
  }

  login(data: any) {
    return this.http.post(this.api + 'login/', data);
  }

  verifyOtp(data: any) {
    return this.http.post(this.api + 'verify-otp/', data);
  }

  resendOtp(data: any) {
    return this.http.post(this.api + 'resend-otp/', data);
  }

  forgotPassword(data: any) {
    return this.http.post(this.api + 'forgot-password/', data);
  }

  resetPassword(data: any) {
    return this.http.post(this.api + 'reset-password/', data);
  }

  getProfile() {
    return this.http.get(this.api + 'profile/');
  }

  updateProfile(formData: FormData) {
    return this.http.put(this.api + 'profile/', formData);
  }
}
