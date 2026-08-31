import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AdminMainSegmentWorkspaceComponent } from './admin-main-segment-workspace';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AcademicDirectoryService } from '../../../../core/services/academic-directory.service';
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
import {
  AdminRegistrationQuestion,
  AdminRegistrationSchemaResponse,
  DEFAULT_ADMIN_SCHEMA,
} from '../../../../core/models/registration.model';

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
    getRegistrationSchema: ReturnType<typeof vi.fn>;
    updateRegistrationSchema: ReturnType<typeof vi.fn>;
    publishRegistrationSchema: ReturnType<typeof vi.fn>;
    seedDefaultRegistrationSchema: ReturnType<typeof vi.fn>;
    getRegistrations: ReturnType<typeof vi.fn>;
    getRegistrationDetail: ReturnType<typeof vi.fn>;
    updateRegistrationStatus: ReturnType<typeof vi.fn>;
    getPrivateDocument: ReturnType<typeof vi.fn>;
    exportRegistrationsCsv: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    hasValidToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockAcademicDirectoryService: {
    getUniversities: ReturnType<typeof vi.fn>;
    getFaculties: ReturnType<typeof vi.fn>;
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
      setStatus: vi.fn().mockReturnValue(
        of({
          ...sampleAdminResponse,
          status: MainSegmentEditionStatus.Published,
        }),
      ),
      openRegistration: vi
        .fn()
        .mockReturnValue(of({ ...sampleAdminResponse, isRegistrationAvailable: true })),
      closeRegistration: vi
        .fn()
        .mockReturnValue(of({ ...sampleAdminResponse, isRegistrationAvailable: false })),
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
      deletePersonPhoto: vi.fn().mockReturnValue(
        of({
          ...sampleAdminResponse,
          people: [{ ...sampleSpeaker, photoUrl: null }],
        }),
      ),
      createOrganization: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      updateOrganization: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteOrganization: vi
        .fn()
        .mockReturnValue(of({ ...sampleAdminResponse, organizations: [] })),
      reorderOrganizations: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      uploadOrganizationLogo: vi.fn().mockReturnValue(of(sampleAdminResponse)),
      deleteOrganizationLogo: vi.fn().mockReturnValue(
        of({
          ...sampleAdminResponse,
          organizations: [{ ...sampleOrg, logoUrl: null }],
        }),
      ),
      getRegistrationSchema: vi.fn().mockReturnValue(of(DEFAULT_ADMIN_SCHEMA)),
      updateRegistrationSchema: vi.fn().mockReturnValue(of(DEFAULT_ADMIN_SCHEMA)),
      publishRegistrationSchema: vi
        .fn()
        .mockReturnValue(of({ ...DEFAULT_ADMIN_SCHEMA, isPublished: true, version: 2 })),
      seedDefaultRegistrationSchema: vi.fn().mockReturnValue(of(DEFAULT_ADMIN_SCHEMA)),
      getRegistrations: vi.fn().mockReturnValue(
        of({
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          statusCounts: {
            all: 0,
            submitted: 0,
            underReview: 0,
            accepted: 0,
            waitlisted: 0,
            rejected: 0,
            cancelled: 0,
          },
        }),
      ),
      getRegistrationDetail: vi.fn().mockReturnValue(of(null)),
      updateRegistrationStatus: vi.fn().mockReturnValue(of(null)),
      getPrivateDocument: vi.fn().mockReturnValue(of(new Blob())),
      exportRegistrationsCsv: vi.fn().mockReturnValue(of(new Blob())),
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ name: 'Admin' }),
      hasValidToken: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
    };

    mockAcademicDirectoryService = {
      getUniversities: vi.fn().mockReturnValue(
        of({
          items: [],
          page: 1,
          pageSize: 100,
          totalCount: 0,
          hasNextPage: false,
        }),
      ),
      getFaculties: vi.fn().mockReturnValue(
        of({
          items: [],
          page: 1,
          pageSize: 100,
          totalCount: 0,
          hasNextPage: false,
        }),
      ),
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
        {
          provide: AcademicDirectoryService,
          useValue: mockAcademicDirectoryService,
        },
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

  it('should switch between workspace subtabs and load schema on form-builder tab', () => {
    expect(component.activeTab).toBe('overview');
    component.setTab('program');
    expect(component.activeTab).toBe('program');
    component.setTab('form-builder');
    expect(component.activeTab).toBe('form-builder');
    expect(mockAdminService.getRegistrationSchema).toHaveBeenCalledWith(2026);
  });

  it('opens the saved-page preview in a separate tab without saving or replacing editor state', () => {
    component.form.markAsDirty();
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a.btn-preview') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/admin/main-segment/2026/preview');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    expect(link.textContent).toContain('Preview saved page');
    expect(component.form.dirty).toBe(true);
    expect(mockAdminService.updateEdition).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.preview-modal-overlay')).toBeNull();
  });

  function selectHero(file: File) {
    const input = { files: [file], value: file.name };
    component.onHeroImageSelected({ target: input } as unknown as Event);
    return input;
  }

  it('opens the hero file picker from a keyboard-accessible button', () => {
    const input = fixture.nativeElement.querySelector('input[aria-label="Hero image"]') as HTMLInputElement;
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => {});
    const button = fixture.nativeElement.querySelector('button.btn-upload') as HTMLButtonElement;
    button.click();
    expect(button.type).toBe('button');
    expect(openPicker).toHaveBeenCalledOnce();
  });

  it('updates the hero image without discarding unsaved text edits', () => {
    const file = new File(['image'], 'hero.png', { type: 'image/png' });
    component.form.patchValue({ title: 'Unsaved title' });
    component.form.markAsDirty();
    mockAdminService.uploadHeroImage.mockReturnValue(of({ ...sampleAdminResponse, heroImageUrl: '/uploads/new-hero.png' }));
    const input = selectHero(file);
    expect(mockAdminService.uploadHeroImage).toHaveBeenCalledWith(2026, file);
    expect(component.vm$.value.edition?.heroImageUrl).toBe('/uploads/new-hero.png');
    expect(component.form.value.title).toBe('Unsaved title');
    expect(component.form.dirty).toBe(true);
    expect(input.value).toBe('');
    expect(component.isUploadingImage$.value).toBe(false);
  });

  it('rejects unsupported, empty, and oversized hero files before upload', () => {
    selectHero(new File(['pdf'], 'hero.pdf', { type: 'application/pdf' }));
    expect(component.heroImageError$.value).toContain('JPEG, PNG, or WebP');
    selectHero(new File([], 'empty.png', { type: 'image/png' }));
    expect(component.heroImageError$.value).toContain('empty');
    selectHero(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }));
    expect(component.heroImageError$.value).toContain('5 MB');
    expect(mockAdminService.uploadHeroImage).not.toHaveBeenCalled();
  });

  it('shows upload failures beside the hero control and permits retrying the same file', () => {
    const file = new File(['image'], 'hero.png', { type: 'image/png' });
    mockAdminService.uploadHeroImage.mockReturnValueOnce(throwError(() => ({ error: { message: 'Invalid image data' } })));
    expect(selectHero(file).value).toBe('');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.image-controls [role="alert"]')?.textContent).toContain('Invalid image data');
    expect(component.isUploadingImage$.value).toBe(false);
    selectHero(file);
    expect(mockAdminService.uploadHeroImage).toHaveBeenCalledTimes(2);
    expect(component.heroImageError$.value).toBeNull();
  });

  it('does not send overlapping hero uploads', () => {
    const pending = new Subject<MainSegmentAdminResponse>();
    mockAdminService.uploadHeroImage.mockReturnValue(pending);
    const file = new File(['image'], 'hero.webp', { type: 'image/webp' });
    selectHero(file);
    selectHero(file);
    expect(mockAdminService.uploadHeroImage).toHaveBeenCalledOnce();
    expect(component.isUploadingImage$.value).toBe(true);
    pending.next(sampleAdminResponse);
    pending.complete();
    expect(component.isUploadingImage$.value).toBe(false);
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
    expect(mockAdminService.updateProgramItem).toHaveBeenCalledWith(
      2026,
      'item-1',
      expect.anything(),
    );
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
    expect(mockAdminService.updateOrganization).toHaveBeenCalledWith(
      2026,
      'org-1',
      expect.anything(),
    );
  });

  it('should delete an organization with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteOrg('org-1');
    expect(mockAdminService.deleteOrganization).toHaveBeenCalledWith(2026, 'org-1');
  });

  it('should reorder program items and organizations', () => {
    const item1: MainSegmentAdminProgramItemResponse = {
      ...sampleItem,
      id: '1',
    };
    const item2: MainSegmentAdminProgramItemResponse = {
      ...sampleItem,
      id: '2',
    };

    component.moveProgramItem(0, 'down', [item1, item2]);
    expect(mockAdminService.reorderProgramItems).toHaveBeenCalledWith(2026, ['2', '1']);

    const org1: MainSegmentAdminOrganizationResponse = {
      ...sampleOrg,
      id: 'o1',
    };
    const org2: MainSegmentAdminOrganizationResponse = {
      ...sampleOrg,
      id: 'o2',
    };

    component.moveOrg(0, 'down', [org1, org2]);
    expect(mockAdminService.reorderOrganizations).toHaveBeenCalledWith(2026, ['o2', 'o1']);
  });

  it('should save registration schema settings and draft', () => {
    component.setTab('form-builder');
    component.schemaSettingsForm.patchValue({
      minGraduationYear: 2022,
      maxGraduationYear: 2030,
      eligibilityText: 'All Engineering students',
      submissionWorkflow: 'InstantConfirmation',
    });

    component.saveDraftSchema();
    expect(mockAdminService.updateRegistrationSchema).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({
        settings: expect.objectContaining({
          minGraduationYear: 2022,
          maxGraduationYear: 2030,
          submissionWorkflow: 'InstantConfirmation',
        }),
      }),
    );
  });

  it('should create, edit, reorder, and delete questions in question builder', () => {
    component.setTab('form-builder');
    component.schema$.next(DEFAULT_ADMIN_SCHEMA);

    component.openAddQuestionModal();
    expect(component.isQuestionModalOpen$.value).toBe(true);

    component.questionForm.patchValue({
      title: 'T-Shirt Size',
      key: 'tshirt_size',
      type: 'SingleChoice',
      isRequired: true,
      isActive: true,
    });
    component.addQuestionOption();
    component.questionOptionsArray.at(0).patchValue({ label: 'Medium', value: 'M' });

    component.saveQuestion();
    expect(component.schema$.value?.questions.some((q) => q.key === 'tshirt_size')).toBe(true);

    // Edit question
    const addedQ = component.schema$.value?.questions.find((q) => q.key === 'tshirt_size')!;
    component.openEditQuestionModal(addedQ);
    component.questionForm.patchValue({ title: 'Preferred T-Shirt Size' });
    component.saveQuestion();
    expect(component.schema$.value?.questions.find((q) => q.key === 'tshirt_size')?.title).toBe(
      'Preferred T-Shirt Size',
    );

    // Delete question
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteQuestion(addedQ.id);
    expect(component.schema$.value?.questions.some((q) => q.key === 'tshirt_size')).toBe(false);
  });

  it('should prevent deleting questions that have conditional dependents', () => {
    component.setTab('form-builder');
    component.schema$.next(DEFAULT_ADMIN_SCHEMA);

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Question q-join-asme has dependent q-team-interest
    component.deleteQuestion('q-join-asme');
    expect(alertSpy).toHaveBeenCalled();
    expect(component.schema$.value?.questions.some((q) => q.id === 'q-join-asme')).toBe(true);
  });

  it('should publish schema and seed defaults with confirmation', () => {
    component.setTab('form-builder');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.publishSchema();
    expect(mockAdminService.publishRegistrationSchema).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ questions: DEFAULT_ADMIN_SCHEMA.questions }),
    );

    component.seedDefaultQuestions();
    expect(mockAdminService.seedDefaultRegistrationSchema).toHaveBeenCalledWith(2026);
  });

  it('should load registrations list, change status filter, and paginate', () => {
    const mockListResponse = {
      items: [
        {
          id: 'reg-1',
          referenceNumber: 'REG-2026-0001',
          nameEnglish: 'Youssef Ahmed',
          nameArabic: 'يوسف أحمد',
          email: 'youssef@example.com',
          phoneNumber: '01012345678',
          universityName: 'Cairo University',
          facultyName: 'Faculty of Engineering',
          graduationYear: 2026,
          status: 'Submitted' as const,
          submittedAt: '2026-09-02T14:32:00Z',
        },
      ],
      totalCount: 25,
      page: 1,
      pageSize: 10,
      totalPages: 3,
      statusCounts: {
        all: 25,
        submitted: 10,
        underReview: 5,
        accepted: 6,
        waitlisted: 1,
        rejected: 1,
        cancelled: 2,
      },
    };

    mockAdminService.getRegistrations = vi.fn().mockReturnValue(of(mockListResponse));

    component.setTab('registrations');
    expect(component.activeTab).toBe('registrations');
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ page: 1 }),
    );

    // Change status filter
    component.setRegistrationStatusFilter('Accepted');
    expect(component.regStatusFilter).toBe('Accepted');
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ status: 'Accepted' }),
    );

    // Search query
    component.onRegistrationSearch('Youssef');
    expect(component.regSearch).toBe('Youssef');
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ search: 'Youssef' }),
    );

    component.setRegistrationUniversityFilter('uni-1');
    expect(mockAcademicDirectoryService.getFaculties).toHaveBeenCalledWith(
      'uni-1',
      undefined,
      1,
      100,
    );
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ universityId: 'uni-1' }),
    );

    component.setRegistrationFacultyFilter('faculty-1');
    component.setRegistrationDateFilter('from', '2026-09-01');
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({
        facultyId: 'faculty-1',
        submittedFrom: new Date('2026-09-01T00:00:00.000').toISOString(),
      }),
    );

    // Paginate
    component.goToRegistrationPage(2);
    expect(component.regPage).toBe(2);
    expect(mockAdminService.getRegistrations).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({ page: 2 }),
    );
  });

  it('should open applicant detail drawer, update status, and close', () => {
    const mockDetail = {
      id: 'reg-1',
      editionYear: 2026,
      referenceNumber: 'REG-2026-0001',
      status: 'Submitted' as const,
      submittedAt: '2026-09-02T14:32:00Z',
      updatedAt: '2026-09-02T14:32:00Z',
      nameEnglish: 'Youssef Ahmed',
      nameArabic: 'يوسف أحمد',
      email: 'youssef@example.com',
      phoneNumber: '01012345678',
      gender: 'Male',
      maskedNationalId: '2990101******4',
      academicSnapshot: {
        universityName: 'Cairo University',
        facultyName: 'Faculty of Engineering',
        isUniversityOther: false,
        isFacultyOther: false,
        isDepartmentOther: false,
        graduationYear: 2026,
      },
      answers: [
        {
          questionId: 'q-1',
          questionKey: 'referral_source',
          questionTitle: 'How did you hear about us?',
          questionType: 'SingleChoice',
          answerText: 'Social Media',
        },
      ],
      hasNationalIdPhoto: true,
      hasUniversityIdPhoto: true,
      hasCvFile: true,
      documents: [
        {
          documentType: 'NationalIdPhoto' as const,
          displayName: 'national-id.png',
          contentType: 'image/png',
          byteSize: 100,
          storedAt: '2026-09-02T14:32:00Z',
        },
        {
          documentType: 'UniversityIdPhoto' as const,
          displayName: 'university-id.png',
          contentType: 'image/png',
          byteSize: 100,
          storedAt: '2026-09-02T14:32:00Z',
        },
        {
          documentType: 'Cv' as const,
          displayName: 'youssef-cv.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          byteSize: 100,
          storedAt: '2026-09-02T14:32:00Z',
        },
      ],
      statusHistory: [
        {
          id: 'h-1',
          fromStatus: null,
          toStatus: 'Submitted' as const,
          changedBy: 'System',
          changedAt: '2026-09-02T14:32:00Z',
        },
      ],
    };

    const refreshedDetail = {
      ...mockDetail,
      status: 'Accepted' as const,
      statusHistory: [
        ...mockDetail.statusHistory,
        {
          id: 'h-2',
          fromStatus: 'Submitted' as const,
          toStatus: 'Accepted' as const,
          changedBy: 'Admin',
          changedAt: '2026-09-03T10:00:00Z',
          note: 'Verified student ID card',
        },
      ],
    };
    mockAdminService.getRegistrationDetail = vi
      .fn()
      .mockReturnValueOnce(of(mockDetail))
      .mockReturnValue(of(refreshedDetail));
    mockAdminService.updateRegistrationStatus = vi.fn().mockReturnValue(
      of({
        id: 'reg-1',
        reference: 'REG-2026-0001',
        status: 'Accepted' as const,
        changedAt: '2026-09-03T10:00:00Z',
        note: 'Verified student ID card',
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.openRegistrationDetail('reg-1');
    expect(component.isDetailModalOpen$.value).toBe(true);
    expect(component.selectedRegistration$.value?.referenceNumber).toBe('REG-2026-0001');

    // Update status
    component.statusUpdateForm.patchValue({
      status: 'Accepted',
      note: 'Verified student ID card',
    });
    component.submitStatusUpdate();
    expect(mockAdminService.updateRegistrationStatus).toHaveBeenCalledWith(2026, 'reg-1', {
      status: 'Accepted',
      note: 'Verified student ID card',
    });
    expect(component.selectedRegistration$.value?.status).toBe('Accepted');
    expect(component.selectedRegistration$.value?.statusHistory).toHaveLength(2);
    expect(mockAdminService.getRegistrationDetail).toHaveBeenCalledTimes(2);
    expect(mockAdminService.getRegistrations).toHaveBeenCalledTimes(1);

    component.closeRegistrationDetail();
    expect(component.isDetailModalOpen$.value).toBe(false);
  });

  it('preserves zero order and hyphenated keys while editing and protects unsaved questions', () => {
    component.setTab('form-builder');
    const question: AdminRegistrationQuestion = {
      id: 'existing-first', key: 'where-heard', title: 'Where did you hear?',
      type: 'SingleChoice', isActive: true, isRequired: true, displayOrder: 0, allowOther: true,
      options: [{ id: 'other', value: 'other', label: 'Other', isOther: true }],
    };
    component.schema$.next({ ...DEFAULT_ADMIN_SCHEMA, questions: [question] });
    component.openEditQuestionModal(question);
    component.questionForm.patchValue({ title: 'How did you hear about us?' });
    expect(component.questionForm.valid).toBe(true);
    component.saveQuestion();
    expect(component.schema$.value?.questions[0]).toMatchObject({ displayOrder: 0, key: 'where-heard' });
    expect(component.schema$.value?.questions[0].options).toHaveLength(1);
    expect(component.schemaDirty).toBe(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(component.canDeactivate()).toBe(false);
  });

  it('does not let hidden option inputs prevent switching a question to text', () => {
    component.setTab('form-builder');
    component.openAddQuestionModal();
    component.questionForm.patchValue({ title: 'A text question', key: 'a-text-question', type: 'SingleChoice' });
    component.addQuestionOption();
    expect(component.questionForm.invalid).toBe(true);
    component.questionForm.patchValue({ type: 'LongText' });
    expect(component.questionForm.valid).toBe(true);
    component.saveQuestion();
    expect(component.schema$.value?.questions.at(-1)).toMatchObject({ type: 'LongText', options: null });
  });

  it('clears the form preview when switching to Applications and retains local questions', () => {
    component.setTab('form-builder');
    component.moveQuestion(0, 'down');
    const schema = component.schema$.value;
    component.openSchemaPreview();
    expect(component.isSchemaPreviewOpen$.value).toBe(true);
    expect(component.schemaPreview?.questions.length).toBeGreaterThan(0);
    component.setTab('registrations');
    expect(component.isSchemaPreviewOpen$.value).toBe(false);
    expect(component.schemaPreview).toBeNull();
    expect(component.schema$.value).toBe(schema);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-main-segment-registration-modal')).toBeNull();
  });

  it('surfaces backend form validation messages and preserves unsaved work on failure', () => {
    component.setTab('form-builder');
    component.moveQuestion(0, 'down');
    mockAdminService.publishRegistrationSchema.mockReturnValue(throwError(() => ({ status: 400, error: { Message: 'A condition is invalid.' } })));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.publishSchema();
    expect(component.errorMessage$.value).toBe('A condition is invalid.');
    expect(component.schemaDirty).toBe(true);
    expect(component.isSavingSchema$.value).toBe(false);
  });

  it('loads all university pages for application filters', () => {
    mockAcademicDirectoryService.getUniversities.mockReturnValueOnce(of({ items: [{ id: 'first' }], page: 1, hasNextPage: true }))
      .mockReturnValueOnce(of({ items: [{ id: 'last' }], page: 2, hasNextPage: false }));
    component.loadRegistrationUniversityFilters();
    expect(mockAcademicDirectoryService.getUniversities).toHaveBeenLastCalledWith(undefined, 2, 100);
    expect(component.registrationUniversities$.value.map(item => item.id)).toEqual(['first', 'last']);
  });

  it('ignores stale faculty filter results and applies only submitted search text', () => {
    const older = new Subject<any>();
    mockAcademicDirectoryService.getFaculties.mockReturnValueOnce(older).mockReturnValue(of({ items: [{ facultyId: 'new' }] }));
    component.setRegistrationUniversityFilter('old-university');
    component.setRegistrationUniversityFilter('new-university');
    older.next({ items: [{ facultyId: 'old' }] });
    expect(component.registrationFaculties$.value[0].facultyId).toBe('new');
    component.onRegistrationSearch('applied');
    component.regSearchInput = 'not searched';
    component.setRegistrationStatusFilter('Accepted');
    expect(mockAdminService.getRegistrations).toHaveBeenLastCalledWith(2026, expect.objectContaining({ search: 'applied' }));
  });

  it('does not reopen applicant details when a pending status save finishes after closing', () => {
    const pending = new Subject<any>();
    mockAdminService.getRegistrationDetail.mockReturnValue(of({ id: 'reg-1', referenceNumber: 'R-1', status: 'Submitted' }));
    mockAdminService.updateRegistrationStatus.mockReturnValue(pending);
    component.openRegistrationDetail('reg-1');
    component.statusUpdateForm.patchValue({ status: 'UnderReview' });
    component.submitStatusUpdate();
    component.closeRegistrationDetail();
    pending.next({});
    pending.complete();
    expect(component.selectedRegistration$.value).toBeNull();
    expect(component.isDetailModalOpen$.value).toBe(false);
    expect(component.isUpdatingStatus$.value).toBe(false);
  });

  it('should view private document in lightbox and export CSV file', () => {
    mockAdminService.getPrivateDocument = vi
      .fn()
      .mockReturnValue(of(new Blob(['image-binary'], { type: 'image/png' })));
    mockAdminService.exportRegistrationsCsv = vi
      .fn()
      .mockReturnValue(of(new Blob(['CSV,DATA\n1,2'], { type: 'text/csv' })));

    const createUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:http://localhost/doc');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    component.openPrivateDocument('reg-1', 'national-id', 'National ID Photo');
    expect(component.documentViewer$.value.isOpen).toBe(true);
    expect(component.documentViewer$.value.objectUrl).toBe('blob:http://localhost/doc');

    component.closeDocumentViewer();
    expect(component.documentViewer$.value.isOpen).toBe(false);
    expect(revokeUrlSpy).toHaveBeenCalled();

    // Export CSV
    component.registrations$.next({
      items: [],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      statusCounts: {
        all: 1,
        submitted: 1,
        underReview: 0,
        accepted: 0,
        waitlisted: 0,
        rejected: 0,
        cancelled: 0,
      },
    });
    component.exportRegistrationsCsv();
    expect(mockAdminService.exportRegistrationsCsv).toHaveBeenCalledWith(2026, expect.anything());
  });
});
