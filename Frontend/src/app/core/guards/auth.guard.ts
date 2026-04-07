import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If we are in the server (SSR), we generally allow it or handle it elsewhere,
  // but to be safe for SSR we can check platform:
  if (!isPlatformBrowser(platformId)) {
     return false; // or true if not SSR protected
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in, redirect to login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
