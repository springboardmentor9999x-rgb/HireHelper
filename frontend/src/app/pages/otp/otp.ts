import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-otp',
  standalone: true,  // Add if converting to standalone
  imports: [FormsModule, CommonModule],  // Add if standalone
  templateUrl: './otp.html',
  styleUrl: './otp.css'
})
export class OtpComponent implements OnInit, OnDestroy {

  email: string = '';
  otpValue: string = '';
  errorMessage: string = '';

  // Individual digit models
  digit1: string = '';
  digit2: string = '';
  digit3: string = '';
  digit4: string = '';
  digit5: string = '';
  digit6: string = '';

  timer: number = 60;
  timerInterval: any;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit() {
    this.email = localStorage.getItem('pendingOtpEmail') || '';
    this.startTimer();

    if (localStorage.getItem('pendingOtpTriggerResend') === 'true' && this.email) {
      localStorage.removeItem('pendingOtpTriggerResend');
      this.sendResendRequest();
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Move to next input on digit entry (prevInput ignored, kept for HTML compat)
  moveToNext(event: any, _prevInput: any, nextInput: any) {
    const input = event.target;
    if (input.value.length === 1 && nextInput) {
      nextInput.focus();
    }
    this.updateOtpValue();
  }

  // Move to previous input on backspace
  moveToPrevious(event: any, prevInput: any) {
    if (event.key === 'Backspace' && !event.target.value && prevInput) {
      prevInput.focus();
    }
    this.updateOtpValue();
  }

  // Combine all digits into OTP string
  updateOtpValue() {
    this.otpValue = this.digit1 + this.digit2 + this.digit3 +
                    this.digit4 + this.digit5 + this.digit6;
    this.errorMessage = '';
  }

  // Check if OTP is complete
  isOtpComplete(): boolean {
    return this.otpValue.length === 6;
  }

  // Start countdown timer
  startTimer() {
    this.timer = 60;
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // Resend OTP
  resendOtp() {
    if (!this.email) {
      this.toast.error('Please enter your email first');
      return;
    }

    this.sendResendRequest();
  }

  private sendResendRequest() {
    this.auth.resendOtp({ email: this.email }).subscribe(
      (res: any) => {
        if (res?.otp) {
          this.toast.warning(`Email delivery failed. Use this OTP: ${res.otp}`, 4500);
        } else {
          this.toast.success('Verification code resent to your email');
        }
        this.startTimer();
        this.digit1 = this.digit2 = this.digit3 =
        this.digit4 = this.digit5 = this.digit6 = '';
        this.otpValue = '';
      },
      (err: any) => {
        this.errorMessage = err?.error?.error || 'Failed to resend OTP. Please try again.';
      }
    );
  }

  // Verify OTP
  verify() {
    if (!this.isOtpComplete()) {
      this.errorMessage = 'Please enter the complete 6-digit code';
      return;
    }

    this.auth.verifyOtp({ email: this.email, otp: this.otpValue }).subscribe(
      (res: any) => {
        localStorage.removeItem('pendingOtpEmail');
        this.toast.success('Account Verified Successfully!');
        this.router.navigate(['/login']);
      },
      err => {
        this.errorMessage = 'Invalid verification code. Please try again.';
        this.digit1 = this.digit2 = this.digit3 =
        this.digit4 = this.digit5 = this.digit6 = '';
        this.otpValue = '';
      }
    );
  }
}
