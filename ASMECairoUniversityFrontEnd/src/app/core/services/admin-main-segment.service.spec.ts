import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminMainSegmentService } from './admin-main-segment.service';
import { environment } from '../../../environments/environment';
import {
  CreateMainSegmentEditionRequest,
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
  MainSegmentOrganizationCategory,
  MainSegmentOrganizationRequest,
  MainSegmentPersonRequest,
  MainSegmentProgramCategory,
  MainSegmentProgramItemRequest,
  MainSegmentSectionKey,
  UpdateMainSegmentEditionRequest,
} from '../models/main-segment.model';
import { DEFAULT_ADMIN_SCHEMA } from '../models/registration.model';

describe('AdminMainSegmentService', () => {
  let service: AdminMainSegmentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/admin/main-segments`;

  const sampleAdminResponse: MainSegmentAdminResponse = {
    id: 'd9b1a774-8b65-4f3b-8b5e-4c8d19762101',
    year: 2026,
    slug: 'main-segment-2026',
    title: 'Main Segment 2026',
    heroContent: 'Hero copy',
    heroImageUrl: '/uploads/hero.jpg',
    storyContent: 'Story copy',
    startsAt: '2026-10-15T09:00:00Z',
    endsAt: '2026-10-15T18:00:00Z',
    location: 'Auditorium',
    status: MainSegmentEditionStatus.Draft,
    isRegistrationAvailable: false,
    publishedAt: null,
    archivedAt: null,
    registrationOpensAt: '2026-09-01T00:00:00Z',
    registrationClosesAt: '2026-10-10T00:00:00Z',
    capacity: 500,
    registrationAvailabilityOverride: null,
    careerFairIntro: 'Career fair intro',
    cvReviewAndMockInterviewsIntro: 'CV review intro',
    sections: [
      {
        id: 'sec-1',
        sectionKey: MainSegmentSectionKey.PanelDiscussion,
        isVisible: true,
        displayOrder: 1,
      },
    ],
    programItems: [],
    people: [],
    organizations: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminMainSegmentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminMainSegmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('uploads the hero as multipart file data and returns its updated media URL', () => {
    const file = new File(['image'], 'hero.png', { type: 'image/png' });
    service.uploadHeroImage(2026, file).subscribe(response => {
      expect(response.heroImageUrl).toBe(`${environment.apiUrl}/api/storage/public/main-segment/2026/page/hero/new.png`);
    });
    const request = httpMock.expectOne(`${baseUrl}/2026/hero-image`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ ...sampleAdminResponse, heroImageUrl: '/api/storage/public/main-segment/2026/page/hero/new.png' });
  });

  it('should fetch admin edition summaries', () => {
    const mockSummaries: MainSegmentEditionSummary[] = [
      {
        id: '1',
        year: 2026,
        slug: 'main-segment-2026',
        title: 'Main Segment 2026',
        status: 1 as unknown as MainSegmentEditionStatus,
        startsAt: '2026-10-15T09:00:00Z',
        endsAt: '2026-10-15T18:00:00Z',
        isRegistrationAvailable: false,
      },
    ];

    service.getAdminEditions().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].year).toBe(2026);
      expect(res[0].status).toBe(MainSegmentEditionStatus.Published);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummaries);
  });

  it('should normalize numeric edition enums and image URLs', () => {
    service.getAdminByYear(2026).subscribe((res) => {
      expect(res.year).toBe(2026);
      expect(res.status).toBe(MainSegmentEditionStatus.Published);
      expect(res.sections[0].sectionKey).toBe(MainSegmentSectionKey.PanelDiscussion);
      expect(res.programItems[0].category).toBe(MainSegmentProgramCategory.Workshop);
      expect(res.organizations[0].category).toBe(MainSegmentOrganizationCategory.Sponsor);
      expect(res.organizations[0].sponsorTier).toBe('Platinum');
      expect(res.heroImageUrl).toContain('/uploads/hero.jpg');
    });

    const req = httpMock.expectOne(`${baseUrl}/2026`);
    expect(req.request.method).toBe('GET');
    req.flush({
      ...sampleAdminResponse,
      status: 1,
      sections: [{ ...sampleAdminResponse.sections[0], sectionKey: 0 }],
      programItems: [
        {
          id: 'item-1',
          category: 2,
          title: 'Workshop',
          description: 'Description',
          isVisible: true,
          displayOrder: 1,
          personIds: [],
        },
      ],
      organizations: [
        {
          id: 'org-1',
          name: 'Partner',
          category: 2,
          sponsorTier: 4,
          isVisible: true,
          displayOrder: 1,
        },
      ],
    });
  });

  it('should serialize edition status and section enums as backend numbers', () => {
    service.setStatus(2026, MainSegmentEditionStatus.Published).subscribe();
    const statusReq = httpMock.expectOne(`${baseUrl}/2026/status`);
    expect(statusReq.request.body).toEqual({ status: 1 });
    statusReq.flush(sampleAdminResponse);

    service.updateSections(2026, sampleAdminResponse.sections).subscribe();
    const sectionsReq = httpMock.expectOne(`${baseUrl}/2026/sections`);
    expect(sectionsReq.request.body[0].sectionKey).toBe(0);
    sectionsReq.flush(sampleAdminResponse);
  });

  it('should handle program item CRUD and reordering', () => {
    const itemReq: MainSegmentProgramItemRequest = {
      category: MainSegmentProgramCategory.Talk,
      title: 'Robotics Future',
      description: 'Keynote talk',
      isVisible: true,
    };

    service.createProgramItem(2026, itemReq).subscribe();
    const createReq = httpMock.expectOne(`${baseUrl}/2026/program-items`);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.category).toBe(1);
    createReq.flush(sampleAdminResponse);

    service.updateProgramItem(2026, 'item-1', itemReq).subscribe();
    const updateReq = httpMock.expectOne(`${baseUrl}/2026/program-items/item-1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush(sampleAdminResponse);

    service.deleteProgramItem(2026, 'item-1').subscribe();
    const deleteReq = httpMock.expectOne(`${baseUrl}/2026/program-items/item-1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(sampleAdminResponse);

    service.reorderProgramItems(2026, ['id-1', 'id-2']).subscribe();
    const reorderReq = httpMock.expectOne(`${baseUrl}/2026/program-items/order`);
    expect(reorderReq.request.method).toBe('PUT');
    reorderReq.flush(sampleAdminResponse);
  });

  it('should handle people CRUD, assignments, and photo upload', () => {
    const personReq: MainSegmentPersonRequest = {
      name: 'Dr. Jane',
      jobTitle: 'Senior Researcher',
      shortBio: 'Bio',
    };

    service.createPerson(2026, personReq).subscribe();
    const createReq = httpMock.expectOne(`${baseUrl}/2026/people`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(sampleAdminResponse);

    service.updatePerson(2026, 'p-1', personReq).subscribe();
    const updateReq = httpMock.expectOne(`${baseUrl}/2026/people/p-1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush(sampleAdminResponse);

    service.assignPerson(2026, 'p-1', ['item-1']).subscribe();
    const assignReq = httpMock.expectOne(`${baseUrl}/2026/people/p-1/assignments`);
    expect(assignReq.request.method).toBe('PUT');
    assignReq.flush(sampleAdminResponse);

    const mockFile = new File(['fake-photo'], 'photo.png', {
      type: 'image/png',
    });
    service.uploadPersonPhoto(2026, 'p-1', mockFile).subscribe();
    const photoReq = httpMock.expectOne(`${baseUrl}/2026/people/p-1/photo`);
    expect(photoReq.request.method).toBe('POST');
    photoReq.flush(sampleAdminResponse);

    service.deletePerson(2026, 'p-1').subscribe();
    const deleteReq = httpMock.expectOne(`${baseUrl}/2026/people/p-1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(sampleAdminResponse);
  });

  it('should handle organization CRUD, reordering, and logo upload', () => {
    const orgReq: MainSegmentOrganizationRequest = {
      name: 'Siemens',
      category: MainSegmentOrganizationCategory.Sponsor,
      sponsorTier: 'Platinum',
      isVisible: true,
    };

    service.createOrganization(2026, orgReq).subscribe();
    const createReq = httpMock.expectOne(`${baseUrl}/2026/organizations`);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.category).toBe(2);
    expect(createReq.request.body.sponsorTier).toBe(4);
    createReq.flush(sampleAdminResponse);

    service.updateOrganization(2026, 'org-1', orgReq).subscribe();
    const updateReq = httpMock.expectOne(`${baseUrl}/2026/organizations/org-1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush(sampleAdminResponse);

    const mockFile = new File(['fake-logo'], 'logo.png', { type: 'image/png' });
    service.uploadOrganizationLogo(2026, 'org-1', mockFile).subscribe();
    const logoReq = httpMock.expectOne(`${baseUrl}/2026/organizations/org-1/logo`);
    expect(logoReq.request.method).toBe('POST');
    logoReq.flush(sampleAdminResponse);

    service.deleteOrganization(2026, 'org-1').subscribe();
    const deleteReq = httpMock.expectOne(`${baseUrl}/2026/organizations/org-1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(sampleAdminResponse);
  });

  it('should normalize the real registration-schema contract and publish a saved draft', () => {
    const draftApiResponse = {
      id: '11111111-1111-4111-8111-111111111111',
      schemaId: '11111111-1111-4111-8111-111111111111',
      editionYear: 2026,
      version: 2,
      status: 0,
      createdAt: '2026-08-29T10:00:00Z',
      publishedAt: null,
      questions: [],
    };

    service.getRegistrationSchema(2026).subscribe((res) => {
      expect(res.version).toBe(2);
      expect(res.schemaId).toBe(draftApiResponse.schemaId);
      expect(res.isPublished).toBe(false);
    });
    const getReq = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(draftApiResponse);

    service
      .publishRegistrationSchema(2026, {
        settings: DEFAULT_ADMIN_SCHEMA.settings,
        questions: [],
      })
      .subscribe((res) => {
      expect(res.isPublished).toBe(true);
    });

    const publishGetReq = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    expect(publishGetReq.request.method).toBe('PUT');
    publishGetReq.flush(draftApiResponse);

    const pubReq = httpMock.expectOne(
      `${baseUrl}/2026/registration-schemas/${draftApiResponse.schemaId}/publish`,
    );
    expect(pubReq.request.method).toBe('POST');
    pubReq.flush({
      ...draftApiResponse,
      version: 2,
      status: 'Published',
      publishedAt: '2026-08-29T11:00:00Z',
    });
  });

  it('should persist conditional questions in one atomic draft request using keys instead of revision IDs', () => {
    const schemaId = '11111111-1111-4111-8111-111111111111';
    const joinId = '22222222-2222-4222-8222-222222222222';
    const teamId = '33333333-3333-4333-8333-333333333333';
    const apiSchema = {
      id: schemaId,
      schemaId,
      editionYear: 2026,
      version: 2,
      status: 'Draft',
      createdAt: '2026-08-29T10:00:00Z',
      publishedAt: null,
      questions: [
        {
          id: joinId,
          key: 'join_team',
          prompt: 'Join the team?',
          helperText: null,
          type: 4,
          isRequired: true,
          isActive: true,
          displayOrder: 1,
          condition: null,
          options: [],
        },
        {
          id: teamId,
          key: 'team_choice',
          prompt: 'Which team?',
          helperText: null,
          type: 2,
          isRequired: true,
          isActive: true,
          displayOrder: 2,
          condition: { dependsOnQuestionId: joinId, expectedValue: 'yes' },
          options: [],
        },
      ],
    };

    service
      .updateRegistrationSchema(2026, {
        settings: DEFAULT_ADMIN_SCHEMA.settings,
        questions: [
          {
            id: joinId,
            key: 'join_team',
            title: 'Join the team?',
            type: 'YesNo',
            isRequired: true,
            isActive: true,
            displayOrder: 1,
          },
          {
            id: teamId,
            key: 'team_choice',
            title: 'Which team?',
            type: 'SingleChoice',
            isRequired: true,
            isActive: true,
            displayOrder: 2,
            conditionalOnKey: 'join_team',
            conditionalValue: true,
          },
        ],
      })
      .subscribe((result) => expect(result.questions).toHaveLength(2));

    const saveRequest = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    expect(saveRequest.request.method).toBe('PUT');
    expect(saveRequest.request.body.questions[0]).toMatchObject({ type: 4, displayOrder: 0 });
    expect(saveRequest.request.body.questions[1]).toMatchObject({
      type: 2, displayOrder: 1, dependsOnKey: 'join_team', expectedValue: 'yes',
    });
    expect(JSON.stringify(saveRequest.request.body)).not.toContain(joinId);
    expect(JSON.stringify(saveRequest.request.body)).not.toContain(teamId);
    saveRequest.flush(apiSchema);
  });

  it('should handle getRegistrations, getRegistrationDetail, updateStatus, getDocument, and exportCsv', () => {
    service
      .getRegistrations(2026, {
        page: 2,
        pageSize: 10,
        status: 'Submitted',
        search: ' Youssef ',
        universityId: 'uni-1',
        facultyId: 'faculty-1',
        graduationYear: 2026,
        submittedFrom: '2026-09-01T00:00:00.000Z',
        submittedTo: '2026-09-30T23:59:59.999Z',
      })
      .subscribe((res) => {
        expect(res.totalCount).toBe(1);
        expect(res.items[0].referenceNumber).toBe('REG-2026-0001');
        expect(res.statusCounts.submitted).toBe(1);
      });
    const listReq = httpMock.expectOne((req) => req.url === `${baseUrl}/2026/registrations`);
    expect(listReq.request.method).toBe('GET');
    expect(listReq.request.params.get('search')).toBe('Youssef');
    expect(listReq.request.params.get('status')).toBe('Submitted');
    expect(listReq.request.params.get('universityId')).toBe('uni-1');
    expect(listReq.request.params.get('facultyId')).toBe('faculty-1');
    expect(listReq.request.params.get('graduationYear')).toBe('2026');
    expect(listReq.request.params.get('submittedFrom')).toBe('2026-09-01T00:00:00.000Z');
    expect(listReq.request.params.get('submittedTo')).toBe('2026-09-30T23:59:59.999Z');
    expect(listReq.request.params.get('page')).toBe('2');
    listReq.flush({
      items: [
        {
          id: 'reg-1',
          registrationId: 'reg-1',
          reference: 'REG-2026-0001',
          status: 'Submitted',
          submittedAt: '2026-09-02T14:32:00Z',
          nameEnglish: 'Youssef Ahmed',
          nameArabic: 'يوسف أحمد',
          email: 'youssef@example.com',
          phoneNumber: '01012345678',
          universityId: 'uni-1',
          university: 'Cairo University',
          facultyId: 'faculty-1',
          facultyOfferingId: 'offering-1',
          faculty: 'Faculty of Engineering',
          departmentId: 'department-1',
          department: 'Mechanical Engineering',
          graduationYear: 2026,
          documentCount: 3,
          answerCount: 1,
        },
      ],
      totalCount: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
    });
    const summaryReq = httpMock.expectOne(
      (req) => req.url === `${baseUrl}/2026/registrations/summary`,
    );
    expect(summaryReq.request.params.has('status')).toBe(false);
    expect(summaryReq.request.params.get('search')).toBe('Youssef');
    expect(summaryReq.request.params.get('universityId')).toBe('uni-1');
    summaryReq.flush({
      total: 1,
      totalCount: 1,
      counts: { Submitted: 1 },
      statusCounts: [{ status: 'Submitted', count: 1 }],
    });

    service.getRegistrationDetail(2026, 'reg-1').subscribe((res) => {
      expect(res.referenceNumber).toBe('REG-2026-0001');
      expect(res.maskedNationalId).toBe('2990101******4');
      expect(res.answers[0].selectedOptions).toEqual(['Social Media', 'Other: جامعة القاهرة']);
      expect(res.hasCvFile).toBe(true);
      expect(res.statusHistory[0].changedBy).toBe('Admin User');
    });
    const detailReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1`);
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush({
      id: 'reg-1',
      registrationId: 'reg-1',
      editionYear: 2026,
      editionId: 'edition-1',
      schemaId: 'schema-1',
      schemaVersion: 1,
      reference: 'REG-2026-0001',
      status: 'Submitted',
      submittedAt: '2026-09-02T14:32:00Z',
      nameEnglish: 'Youssef Ahmed',
      nameArabic: 'يوسف أحمد',
      email: 'youssef@example.com',
      phoneNumber: '01012345678',
      gender: 'Male',
      nationalIdMasked: '2990101******4',
      university: 'Cairo University',
      faculty: 'Faculty of Engineering',
      department: 'Mechanical Engineering',
      graduationYear: 2026,
      privacyNoticeVersion: '2026.1',
      privacyNoticeAccepted: true,
      privacyNoticeAcknowledgedAt: '2026-09-02T14:32:00Z',
      answers: [
        {
          questionId: 'q-1',
          questionKey: 'referral_source',
          prompt: 'How did you hear about us?',
          type: 'MultipleChoice',
          isRequired: true,
          answerJson: '["social",{"value":"other","otherText":"جامعة القاهرة"}]',
          optionsSnapshotJson:
            '[{"value":"social","label":"Social Media"},{"value":"other","label":"Other"}]',
        },
      ],
      documents: [
        {
          documentType: 'Cv',
          displayName: 'youssef-cv.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          byteSize: 1024,
          storedAt: '2026-09-02T14:32:00Z',
        },
      ],
      statusHistory: [
        {
          fromStatus: null,
          toStatus: 'Submitted',
          actorAdminId: 'admin-1',
          actorAdminName: 'Admin User',
          createdAt: '2026-09-02T14:32:00Z',
        },
      ],
    });

    service
      .updateRegistrationStatus(2026, 'reg-1', {
        status: 'Accepted',
        note: 'Approved',
      })
      .subscribe((res) => {
        expect(res.status).toBe('Accepted');
      });
    const statusReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1/status`);
    expect(statusReq.request.method).toBe('PATCH');
    statusReq.flush({
      id: 'reg-1',
      reference: 'REG-2026-0001',
      status: 'Accepted',
      changedAt: '2026-09-03T10:00:00Z',
    });

    service.getPrivateDocument(2026, 'reg-1', 'national-id').subscribe((blob) => {
      expect(blob).toBeTruthy();
    });
    const docReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1/documents/national-id`);
    expect(docReq.request.method).toBe('GET');
    docReq.flush(new Blob(['mock-binary'], { type: 'image/png' }));

    service
      .exportRegistrationsCsv(2026, {
        status: 'Accepted',
        search: 'يوسف',
        universityId: 'uni-1',
      })
      .subscribe((blob) => {
        expect(blob).toBeTruthy();
      });
    const exportReq = httpMock.expectOne(
      (req) => req.url === `${baseUrl}/2026/registrations/export`,
    );
    expect(exportReq.request.method).toBe('GET');
    expect(exportReq.request.params.get('status')).toBe('Accepted');
    expect(exportReq.request.params.get('search')).toBe('يوسف');
    expect(exportReq.request.params.get('universityId')).toBe('uni-1');
    expect(exportReq.request.params.has('page')).toBe(false);
    exportReq.flush(new Blob(['CSV DATA'], { type: 'text/csv' }));
  });
});
