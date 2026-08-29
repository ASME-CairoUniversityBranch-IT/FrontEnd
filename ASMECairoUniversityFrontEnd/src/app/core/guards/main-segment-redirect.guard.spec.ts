import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mainSegmentRedirectGuard } from './main-segment-redirect.guard';
import { MainSegmentService } from '../services/main-segment.service';
import { MainSegmentEdition } from '../models/main-segment.model';

describe('mainSegmentRedirectGuard', () => {
  let mockService: {
    getCurrentEdition: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    mockService = {
      getCurrentEdition: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: MainSegmentService, useValue: mockService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should redirect to /main-segment/:year when current edition is found', async () => {
    const mockEdition: Partial<MainSegmentEdition> = {
      year: 2026,
      title: 'Main Segment 2026',
    };
    mockService.getCurrentEdition.mockReturnValue(of(mockEdition as MainSegmentEdition));

    const result = TestBed.runInInjectionContext(() =>
      mainSegmentRedirectGuard({} as any, {} as any)
    );

    if (result && typeof (result as any).subscribe === 'function') {
      (result as any).subscribe((tree: UrlTree) => {
        expect(tree.toString()).toBe('/main-segment/2026');
      });
    }
  });

  it('should redirect to /not-found when current edition cannot be retrieved', async () => {
    mockService.getCurrentEdition.mockReturnValue(throwError(() => new Error('Not found')));

    const result = TestBed.runInInjectionContext(() =>
      mainSegmentRedirectGuard({} as any, {} as any)
    );

    if (result && typeof (result as any).subscribe === 'function') {
      (result as any).subscribe((tree: UrlTree) => {
        expect(tree.toString()).toBe('/not-found');
      });
    }
  });
});
