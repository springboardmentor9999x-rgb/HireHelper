import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule],
  templateUrl:'./verify-otp.html',
  styleUrls:['./verify-otp.css']
})
export class VerifyOtpComponent {

  email_id='';
  otp='';
  error='';

  constructor(
    private auth:AuthService,
    private router:Router,
    private route:ActivatedRoute
  ){
    this.route.queryParams.subscribe(params=>{
      this.email_id = params['email'] || '';
    });
  }

  verifyOtp(){
    this.error = '';

    this.auth.verifyOtp({
      email_id: this.email_id.trim().toLowerCase(),
      otp: this.otp.trim()
    }).subscribe({
      next:(res:any)=>{
        alert(res?.message || 'Account verified successfully');
        this.router.navigate(['/login']);
      },
      error:(err)=>{
        this.error = err.error?.message || 'Invalid OTP';
      }
    });
  }
}
