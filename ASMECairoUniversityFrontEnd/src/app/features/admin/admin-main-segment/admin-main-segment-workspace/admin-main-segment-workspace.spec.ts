import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminMainSegmentWorkspaceComponent } from './admin-main-segment-workspace';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentSectionKey,
} from '../../../../core/models/main-segment.model';

describe('AdminMainSegmentWorkspaceComponent', () => {
  let component: AdminMainSegmentWorkspaceComponent;
  let fixture: ComponentFixture<AdminMainSegmentWorkspaceComponent>;
  let mockAdminService: {
    getAdminByYear: ReturnType<typeof vi.fn>;
    getPreview: ReturnType<typeof vi.fn>;
    updateEdition: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    openRegistration: ReturnType<typeof vi.fn>;
    closeRegistration: ReturnType<typeof vi.fn>;
    uploadHeroImage: ReturnType<typeof vi.fn>;
    deleteHeroImage: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    hasValidToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  const sampleAdminResponse: MainSegmentAdminResponse = {
    id: 'ed-1',
    year: 2026,
    slug: 'main-segment-2026',
    title: 'Main Segment 2026',
    heroContent: 'Hero content',
    heroImageUrl: 'https://example.com/hero.jpg',
    storyContent: 'Why Main Segment matters story narrative.',
    startsAt: '2026-10-15T09:00:00Z',
    endsAt: '2026-10-15T18:00:00Z',
    location: 'Faculty of Engineering, Cairo University',
    registrationOpensAt: '2026-09-01T00:00:00Z',
    registrationClosesAt: '2026-10-10T00:00:00Z',
    capacity: 500,
    status: MainSegmentEditionStatus.Draft,
    publishedAt: null,
    archivedAt: null,
    registrationAvailabilityOverride: null,
    isRegistrationAvailable: false,
    careerFairIntro: 'Career Fair Intro',
    cvReviewAndMockInterviewsIntro: 'CV Review Intro',
    sections: [
      {
        id: 'sec-1',
        sectionKey: MainSegmentSectionKey.PanelDiscussion,
        isVisible: true,
        displayOrder: 1,
      },
      {
        id: 'sec-2',
        sectionKey: MainSegmentSectionKey.Talks,
        isVisible: true,
        displayOrder: 2,
      },
    ],
    programItems: [],
    people: [],
    organizations: [],
  };

  beforeEach(async () => {
    mockAdminService = {
      getAdminByYear: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      getPreview: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      updateEdition: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      setStatus: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, status: MainSegmentEditionStatus.Published })),
      openRegistration: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, isRegistrationAvailable: true })),
      closeRegistration: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, isRegistrationAvailable: false })),
      uploadHeroImage: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteHeroImage: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, heroImageUrl: null })),
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ name: 'Admin' }),
      hasValidToken: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminMainSegmentWorkspaceComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['year', '2026']])),
          },
        },
        { provide: AdminMainSegmentService, useValue: mockAdminService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMainSegmentWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load workspace for year 2026', () => {
    expect(component).toBeTruthy();
    expect(component.year).toBe(2026);
    expect(mockAdminService.getAdminByYear).toHaveBeenCalledWith(2026);
    expect(component.form.get('title')?.value).toBe('Main Segment 2026');
    expect(component.form.get('slug')?.value).toBe('main-segment-2026');
  });

  it('should switch between workspace subtabs', () => {
    expect(component.activeTab).toBe('overview');
    component.setTab('program');
    expect(component.activeTab).toBe('program');
    component.setTab('companies');
    expect(component.activeTab).toBe('companies');
  });

  it('should save draft changes when form is dirty and valid', () => {
    component.form.markAsDirty();
    component.form.patchValue({ title: 'Main Segment 2026 Updated' });

    component.saveDraft();

    expect(mockAdminService.updateEdition).toHaveBeenCalled();
    expect(component.successMessage$.value).toContain('Edition draft successfully saved.');
  });

  it('should toggle publish status', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.togglePublishStatus(MainSegmentEditionStatus.Draft);

    expect(mockAdminService.setStatus).toHaveBeenCalledWith(2026, MainSegmentEditionStatus.Published);
  });

  it('should toggle registration availability', () => {
    component.toggleRegistration(false);
    expect(mockAdminService.openRegistration).toHaveBeenCalledWith(2026);

    component.toggleRegistration(true);
    expect(mockAdminService.closeRegistration).toHaveBeenCalledWith(2026);
  });

  it('should open and close live preview modal', () => {
    component.openPreview();
    expect(mockAdminService.getPreview).toHaveBeenCalledWith(2026);
    expect(component.isPreviewModalOpen$.value).toBe(true);

    component.closePreview();
    expect(component.isPreviewModalOpen$.value).toBe(false);
  });

  it('should guard unsaved changes on canDeactivate', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.form.markAsDirty();

    const canLeave = component.canDeactivate();
    expect(confirmSpy).toHaveBeenCalled();
    expect(canLeave).toBe(false);

    component.form.markAsPristine();
    expect(component.canDeactivate()).toBe(true);
  });
});
