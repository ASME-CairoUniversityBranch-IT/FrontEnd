import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminMainSegmentWorkspaceComponent } from './admin-main-segment-workspace';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MainSegmentAdminOrganizationResponse,
  MainSegmentAdminPersonResponse,
  MainSegmentAdminProgramItemResponse,
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
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
    createProgramItem: ReturnType<typeof vi.fn>;
    updateProgramItem: ReturnType<typeof vi.fn>;
    deleteProgramItem: ReturnType<typeof vi.fn>;
    reorderProgramItems: ReturnType<typeof vi.fn>;
    createPerson: ReturnType<typeof vi.fn>;
    updatePerson: ReturnType<typeof vi.fn>;
    deletePerson: ReturnType<typeof vi.fn>;
    reorderPeople: ReturnType<typeof vi.fn>;
    uploadPersonPhoto: ReturnType<typeof vi.fn>;
    deletePersonPhoto: ReturnType<typeof vi.fn>;
    createOrganization: ReturnType<typeof vi.fn>;
    updateOrganization: ReturnType<typeof vi.fn>;
    deleteOrganization: ReturnType<typeof vi.fn>;
    reorderOrganizations: ReturnType<typeof vi.fn>;
    uploadOrganizationLogo: ReturnType<typeof vi.fn>;
    deleteOrganizationLogo: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    hasValidToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  const sampleSpeaker: MainSegmentAdminPersonResponse = {
    id: 'p-1',
    name: 'Dr. Jane Doe',
    jobTitle: 'Lead Aerodynamics Engineer',
    shortBio: 'Aerodynamics expert at NASA.',
    photoUrl: 'https://example.com/jane.jpg',
    linkedInUrl: 'https://linkedin.com/in/janedoe',
    displayOrder: 1,
    programItemIds: ['item-1'],
  };

  const sampleItem: MainSegmentAdminProgramItemResponse = {
    id: 'item-1',
    category: MainSegmentProgramCategory.Talk,
    title: 'Future of Thermal Fluid Dynamics',
    description: 'Exploration of thermal power innovations.',
    startsAt: '2026-10-15T10:00:00Z',
    endsAt: '2026-10-15T11:00:00Z',
    location: 'Hall A',
    isVisible: true,
    displayOrder: 1,
    personIds: ['p-1'],
  };

  const sampleOrg: MainSegmentAdminOrganizationResponse = {
    id: 'org-1',
    name: 'Siemens Energy',
    category: MainSegmentOrganizationCategory.Sponsor,
    logoUrl: 'https://example.com/siemens.png',
    websiteUrl: 'https://siemens-energy.com',
    sponsorTier: 'Platinum',
    isVisible: true,
    displayOrder: 1,
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
    ],
    programItems: [sampleItem],
    people: [sampleSpeaker],
    organizations: [sampleOrg],
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
      createProgramItem: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      updateProgramItem: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteProgramItem: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, programItems: [] })),
      reorderProgramItems: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      createPerson: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      updatePerson: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deletePerson: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, people: [] })),
      reorderPeople: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      uploadPersonPhoto: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deletePersonPhoto: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, people: [{ ...sampleSpeaker, photoUrl: null }] })),
      createOrganization: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      updateOrganization: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteOrganization: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, organizations: [] })),
      reorderOrganizations: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      uploadOrganizationLogo: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteOrganizationLogo: vi.fn().mockReturnValue(of({ ...sampleAdminResponse, organizations: [{ ...sampleOrg, logoUrl: null }] })),
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

  it('should create and load workspace for year 2026 with items, people, and orgs', () => {
    expect(component).toBeTruthy();
    expect(component.year).toBe(2026);
    expect(mockAdminService.getAdminByYear).toHaveBeenCalledWith(2026);
  });

  it('should switch between workspace subtabs', () => {
    expect(component.activeTab).toBe('overview');
    component.setTab('program');
    expect(component.activeTab).toBe('program');
    component.setTab('companies');
    expect(component.activeTab).toBe('companies');
  });

  it('should open and submit program item modal for creation and editing', () => {
    component.openAddProgramItemModal();
    expect(component.isProgramItemModalOpen$.value).toBe(true);

    component.programItemForm.patchValue({
      category: MainSegmentProgramCategory.Workshop,
      title: 'CAD Modeling Workshop',
      description: 'Hands-on CAD modeling session.',
    });

    component.saveProgramItem();
    expect(mockAdminService.createProgramItem).toHaveBeenCalled();
    expect(component.isProgramItemModalOpen$.value).toBe(false);

    component.openEditProgramItemModal(sampleItem);
    expect(component.editingProgramItemId).toBe('item-1');
    component.saveProgramItem();
    expect(mockAdminService.updateProgramItem).toHaveBeenCalledWith(2026, 'item-1', expect.anything());
  });

  it('should delete a program item with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteProgramItem('item-1');
    expect(mockAdminService.deleteProgramItem).toHaveBeenCalledWith(2026, 'item-1');
  });

  it('should open and submit speaker modal for creation and editing', () => {
    component.openAddPersonModal();
    expect(component.isPersonModalOpen$.value).toBe(true);

    component.personForm.patchValue({
      name: 'Eng. Omar Tarek',
      jobTitle: 'Manufacturing Lead',
      shortBio: 'Specialist in rapid prototyping.',
    });

    component.savePerson();
    expect(mockAdminService.createPerson).toHaveBeenCalled();
    expect(component.isPersonModalOpen$.value).toBe(false);

    component.openEditPersonModal(sampleSpeaker);
    expect(component.editingPersonId).toBe('p-1');
    component.savePerson();
    expect(mockAdminService.updatePerson).toHaveBeenCalledWith(2026, 'p-1', expect.anything());
  });

  it('should delete a speaker with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deletePerson('p-1');
    expect(mockAdminService.deletePerson).toHaveBeenCalledWith(2026, 'p-1');
  });

  it('should open and submit organization modal for creation and editing', () => {
    component.openAddOrgModal();
    expect(component.isOrgModalOpen$.value).toBe(true);

    component.orgForm.patchValue({
      name: 'General Electric',
      category: MainSegmentOrganizationCategory.Sponsor,
      sponsorTier: 'Strategic',
    });

    component.saveOrg();
    expect(mockAdminService.createOrganization).toHaveBeenCalled();
    expect(component.isOrgModalOpen$.value).toBe(false);

    component.openEditOrgModal(sampleOrg);
    expect(component.editingOrgId).toBe('org-1');
    component.saveOrg();
    expect(mockAdminService.updateOrganization).toHaveBeenCalledWith(2026, 'org-1', expect.anything());
  });

  it('should delete an organization with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteOrg('org-1');
    expect(mockAdminService.deleteOrganization).toHaveBeenCalledWith(2026, 'org-1');
  });

  it('should reorder program items and organizations', () => {
    const item1: MainSegmentAdminProgramItemResponse = { ...sampleItem, id: '1' };
    const item2: MainSegmentAdminProgramItemResponse = { ...sampleItem, id: '2' };

    component.moveProgramItem(0, 'down', [item1, item2]);
    expect(mockAdminService.reorderProgramItems).toHaveBeenCalledWith(2026, ['2', '1']);

    const org1: MainSegmentAdminOrganizationResponse = { ...sampleOrg, id: 'o1' };
    const org2: MainSegmentAdminOrganizationResponse = { ...sampleOrg, id: 'o2' };

    component.moveOrg(0, 'down', [org1, org2]);
    expect(mockAdminService.reorderOrganizations).toHaveBeenCalledWith(2026, ['o2', 'o1']);
  });
});
