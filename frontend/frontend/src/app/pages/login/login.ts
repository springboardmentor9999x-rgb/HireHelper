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
  private readonly rememberedLoginKey = 'hirehelperRememberedLogin';

  email = '';
  password = '';
  error = '';
  isSubmitting = false;
  rememberMe = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loadRememberedLogin();
  }

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
        this.persistRememberedLogin();
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

  private loadRememberedLogin(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const savedLogin = localStorage.getItem(this.rememberedLoginKey);
    if (!savedLogin) {
      return;
    }

    try {
      const parsed = JSON.parse(savedLogin) as {
        email?: string;
        password?: string;
        rememberMe?: boolean;
      };

      this.email = parsed.email || '';
      this.password = parsed.password || '';
      this.rememberMe = !!parsed.rememberMe;
    } catch {
      localStorage.removeItem(this.rememberedLoginKey);
    }
  }

  private persistRememberedLogin(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    if (!this.rememberMe) {
      localStorage.removeItem(this.rememberedLoginKey);
      return;
    }

    localStorage.setItem(
      this.rememberedLoginKey,
      JSON.stringify({
        email: this.email.trim().toLowerCase(),
        password: this.password,
        rememberMe: true
      })
    );
  }
}
