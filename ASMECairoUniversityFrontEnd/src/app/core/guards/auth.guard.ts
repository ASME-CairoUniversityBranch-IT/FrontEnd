import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guards every /admin/* route (dashboard, projects, create-project, update-project).
 * Anonymous visitors and expired-token visitors get bounced to /login with a returnUrl;
 * everywhere else in the app should NOT use this guard, since admins with an invalid/
 * expired token should still be able to browse the public site normally — they should
 * just never be able to reach the admin section without signing in first.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
