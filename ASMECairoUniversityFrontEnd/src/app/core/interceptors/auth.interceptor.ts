import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the bearer token to outgoing API calls when one is available.
 * Deliberately does NOT redirect to /login on 401/403 — per product rules,
 * the login form is only ever shown when an admin tries to reach the
 * project-creation page (handled by authGuard). Every other request just
 * fails normally and the calling component decides how to surface that.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(cloned);
};
