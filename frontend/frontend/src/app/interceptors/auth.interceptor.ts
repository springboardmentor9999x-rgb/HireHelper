import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const AUTH_BYPASS_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem('token') : null;

  const shouldBypass = AUTH_BYPASS_PATHS.some((path) => req.url.includes(path));
  const authReq = !shouldBypass && token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isBrowser) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
