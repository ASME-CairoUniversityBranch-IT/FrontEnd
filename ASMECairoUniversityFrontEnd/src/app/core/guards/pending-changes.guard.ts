import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (component) => {
  if (!component || !component.canDeactivate) {
    return true;
  }
  return component.canDeactivate();
};
