import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MainSegmentService } from '../services/main-segment.service';

/**
 * Redirects `/main-segment` to the latest published edition's route `/main-segment/:year`.
 * If no edition is currently published or the API request fails, redirects to `/not-found`.
 */
export const mainSegmentRedirectGuard: CanActivateFn = () => {
  const service = inject(MainSegmentService);
  const router = inject(Router);

  return service.getCurrentEdition().pipe(
    map((edition) => router.createUrlTree(['/main-segment', edition.year])),
    catchError(() => of(router.createUrlTree(['/not-found'])))
  );
};
