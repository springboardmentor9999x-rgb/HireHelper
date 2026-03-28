import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule,RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email = '';
  password = '';
  error = '';
  isSubmitting = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    this.error = '';
    this.isSubmitting = true;

    this.auth.login({
      email_id: this.email.trim().toLowerCase(),
      password: this.password
    })
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res:any) => {
        this.auth.saveToken(res.token);
        this.auth.saveUser(res.user);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.password = '';
        this.error = err.error?.message
          || (err.status === 400 ? 'Invalid email or password' : 'Login failed');
        this.cdr.detectChanges();
      }
    });
  }
}
