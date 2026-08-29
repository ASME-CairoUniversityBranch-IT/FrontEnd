import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminMainSegmentListComponent } from './admin-main-segment-list';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
} from '../../../../core/models/main-segment.model';

describe('AdminMainSegmentListComponent', () => {
  let component: AdminMainSegmentListComponent;
  let fixture: ComponentFixture<AdminMainSegmentListComponent>;
  let mockAdminService: {
    getAdminEditions: ReturnType<typeof vi.fn>;
    createEdition: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    hasValidToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockSummaries: MainSegmentEditionSummary[] = [
    {
      id: '1',
      year: 2026,
      slug: 'main-segment-2026',
      title: 'Main Segment 2026',
      status: MainSegmentEditionStatus.Draft,
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T18:00:00Z',
      isRegistrationAvailable: false,
    },
    {
      id: '2',
      year: 2025,
      slug: 'main-segment-2025',
      title: 'Main Segment 2025',
      status: MainSegmentEditionStatus.Published,
      startsAt: '2025-10-15T09:00:00Z',
      endsAt: '2025-10-15T18:00:00Z',
      isRegistrationAvailable: true,
    },
  ];

  beforeEach(async () => {
    mockAdminService = {
      getAdminEditions: vi.fn().mockReturnValue(of(mockSummaries)),
      createEdition: vi.fn(),
    };
    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ name: 'Admin' }),
      hasValidToken: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminMainSegmentListComponent],
      providers: [
        provideRouter([]),
        { provide: AdminMainSegmentService, useValue: mockAdminService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AdminMainSegmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load editions list sorted by year descending', () => {
    expect(component).toBeTruthy();
    expect(mockAdminService.getAdminEditions).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.edition-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('2026');
    expect(cards[1].textContent).toContain('2025');
  });

  it('should open and close the create modal', () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen$.value).toBe(true);

    component.closeCreateModal();
    expect(component.isCreateModalOpen$.value).toBe(false);
  });

  it('should submit valid create form and navigate to workspace', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const createdEdition: MainSegmentAdminResponse = {
      id: 'new-id',
      year: 2027,
      slug: 'main-segment-2027',
      title: 'Main Segment 2027',
      heroContent: 'Hero',
      storyContent: 'Story',
      startsAt: '2027-10-15T09:00:00Z',
      endsAt: '2027-10-15T18:00:00Z',
      location: 'CUFE',
      status: MainSegmentEditionStatus.Draft,
      isRegistrationAvailable: false,
      sections: [],
      programItems: [],
      people: [],
      organizations: [],
    };

    mockAdminService.createEdition.mockReturnValue(of(createdEdition));

    component.createForm.patchValue({
      year: 2027,
      slug: 'main-segment-2027',
      title: 'Main Segment 2027',
      heroContent: 'Hero',
      storyContent: 'Story',
      startsAt: '2027-10-15T09:00',
      endsAt: '2027-10-15T18:00',
      location: 'CUFE',
    });

    component.submitCreate();

    expect(mockAdminService.createEdition).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/main-segment', 2027]);
  });

  it('should handle create error and show error message', () => {
    mockAdminService.createEdition.mockReturnValue(
      throwError(() => ({ error: { message: 'Edition 2026 already exists.' } }))
    );

    component.createForm.patchValue({
      year: 2026,
      slug: 'main-segment-2026',
      title: 'Main Segment 2026',
      heroContent: 'Hero',
      storyContent: 'Story',
      startsAt: '2026-10-15T09:00',
      endsAt: '2026-10-15T18:00',
      location: 'CUFE',
    });

    component.submitCreate();

    expect(component.createError$.value).toBe('Edition 2026 already exists.');
  });
});
