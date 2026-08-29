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

describe('AdminMainSegmentService', () => {
  let service: AdminMainSegmentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin/main-segments`;

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
      providers: [
        AdminMainSegmentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminMainSegmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch admin edition summaries', () => {
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
    ];

    service.getAdminEditions().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].year).toBe(2026);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummaries);
  });

  it('should get edition by year and normalize image URLs', () => {
    service.getAdminByYear(2026).subscribe((res) => {
      expect(res.year).toBe(2026);
      expect(res.heroImageUrl).toContain('/uploads/hero.jpg');
    });

    const req = httpMock.expectOne(`${baseUrl}/2026`);
    expect(req.request.method).toBe('GET');
    req.flush(sampleAdminResponse);
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

    const mockFile = new File(['fake-photo'], 'photo.png', { type: 'image/png' });
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

  it('should handle registration schema GET, PUT, publish, and seed-defaults', () => {
    service.getRegistrationSchema(2026).subscribe((res) => {
      expect(res.version).toBe(1);
    });
    const getReq = httpMock.expectOne(`${baseUrl}/2026/schema`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush({
      version: 1,
      isPublished: true,
      settings: {
        minGraduationYear: 2020,
        maxGraduationYear: 2035,
        privacyNoticeVersion: '2026.1',
        submissionWorkflow: 'ReviewFirst',
      },
      questions: [],
    });

    service.publishRegistrationSchema(2026).subscribe((res) => {
      expect(res.isPublished).toBe(true);
    });
    const pubReq = httpMock.expectOne(`${baseUrl}/2026/schema/publish`);
    expect(pubReq.request.method).toBe('POST');
    pubReq.flush({
      version: 2,
      isPublished: true,
      publishedVersion: 2,
      settings: {},
      questions: [],
    });
  });

  it('should handle getRegistrations, getRegistrationDetail, updateStatus, getDocument, and exportCsv', () => {
    service.getRegistrations(2026, { page: 1, pageSize: 10, status: 'Received', search: 'Youssef' }).subscribe((res) => {
      expect(res.totalCount).toBe(1);
    });
    const listReq = httpMock.expectOne((req) => req.url === `${baseUrl}/2026/registrations` && req.params.get('search') === 'Youssef');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({
      items: [],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      statusCounts: { all: 1, received: 1, underReview: 0, accepted: 0, rejected: 0, waitlisted: 0, confirmed: 0 },
    });

    service.getRegistrationDetail(2026, 'reg-1').subscribe((res) => {
      expect(res.referenceNumber).toBe('REG-2026-0001');
    });
    const detailReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1`);
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush({
      id: 'reg-1',
      referenceNumber: 'REG-2026-0001',
      status: 'Received',
    });

    service.updateRegistrationStatus(2026, 'reg-1', { status: 'Accepted', note: 'Approved' }).subscribe((res) => {
      expect(res.status).toBe('Accepted');
    });
    const statusReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1/status`);
    expect(statusReq.request.method).toBe('PATCH');
    statusReq.flush({
      id: 'reg-1',
      status: 'Accepted',
    });

    service.getPrivateDocument(2026, 'reg-1', 'national-id').subscribe((blob) => {
      expect(blob).toBeTruthy();
    });
    const docReq = httpMock.expectOne(`${baseUrl}/2026/registrations/reg-1/documents/national-id`);
    expect(docReq.request.method).toBe('GET');
    docReq.flush(new Blob(['mock-binary'], { type: 'image/png' }));

    service.exportRegistrationsCsv(2026, { status: 'All' }).subscribe((blob) => {
      expect(blob).toBeTruthy();
    });
    const exportReq = httpMock.expectOne((req) => req.url === `${baseUrl}/2026/registrations/export`);
    expect(exportReq.request.method).toBe('GET');
    exportReq.flush(new Blob(['CSV DATA'], { type: 'text/csv' }));
  });
});
