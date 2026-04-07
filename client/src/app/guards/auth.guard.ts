import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function isTokenValid(token: string): boolean {
    try {
        // JWT is three base64 segments separated by dots
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds; Date.now() is in milliseconds
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    if (token && isTokenValid(token)) {
        return true;
    }

    // Token missing or expired — clean up and redirect
    authService.logout();
    router.navigate(['/login']);
    return false;
};
