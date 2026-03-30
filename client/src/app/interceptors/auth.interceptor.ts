import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    console.log(`[AuthInterceptor] Intercepting request: ${req.method} ${req.url}`);
    
    // Check if window is defined to ensure we are in a browser environment
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log(`[AuthInterceptor] Token found: ${!!token}`);

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
        console.log(`[AuthInterceptor] Added Authorization header`);
    } else {
        console.warn(`[AuthInterceptor] No token found in localStorage`);
    }

    return next(req);
};