import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
                // Token expired or invalid — force logout
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => err);
        })
    );
};