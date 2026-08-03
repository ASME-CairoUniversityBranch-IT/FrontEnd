import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Only meant to guard the project-creation route. Anonymous visitors and
 * expired-token visitors get bounced to /login with a returnUrl; everywhere
 * else in the app should NOT use this guard, since admins with an invalid/
 * expired token should still be able to browse the site normally — they
 * should just never be forced onto the login form outside of creating a project.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
