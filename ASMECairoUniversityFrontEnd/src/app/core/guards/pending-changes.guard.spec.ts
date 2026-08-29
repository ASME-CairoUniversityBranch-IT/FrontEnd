import { ComponentCanDeactivate, pendingChangesGuard } from './pending-changes.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('pendingChangesGuard', () => {
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  it('should return true if component has no canDeactivate method', () => {
    const result = pendingChangesGuard(
      {} as ComponentCanDeactivate,
      dummyRoute,
      dummyState,
      dummyState
    );
    expect(result).toBe(true);
  });

  it('should delegate to component canDeactivate method', () => {
    const component: ComponentCanDeactivate = {
      canDeactivate: vi.fn().mockReturnValue(false),
    };

    const result = pendingChangesGuard(
      component,
      dummyRoute,
      dummyState,
      dummyState
    );
    expect(component.canDeactivate).toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
