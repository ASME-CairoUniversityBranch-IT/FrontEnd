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

  it('should fetch preview data for an edition', () => {
    service.getPreview(2026).subscribe((res) => {
      expect(res.year).toBe(2026);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/preview`);
    expect(req.request.method).toBe('GET');
    req.flush(sampleAdminResponse);
  });

  it('should create an edition', () => {
    const createReq: CreateMainSegmentEditionRequest = {
      year: 2026,
      slug: 'main-segment-2026',
      title: 'Main Segment 2026',
      heroContent: 'Hero',
      storyContent: 'Story',
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T18:00:00Z',
      location: 'Faculty of Engineering',
    };

    service.createEdition(createReq).subscribe((res) => {
      expect(res.year).toBe(2026);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(sampleAdminResponse);
  });

  it('should update edition settings', () => {
    const updateReq: UpdateMainSegmentEditionRequest = {
      slug: 'main-segment-2026',
      title: 'Updated Title',
      heroContent: 'Updated Hero',
      storyContent: 'Updated Story',
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T18:00:00Z',
      location: 'Faculty of Engineering',
    };

    service.updateEdition(2026, updateReq).subscribe((res) => {
      expect(res.year).toBe(2026);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(sampleAdminResponse);
  });

  it('should update edition status (e.g. Published)', () => {
    service.setStatus(2026, MainSegmentEditionStatus.Published).subscribe((res) => {
      expect(res.status).toBe(MainSegmentEditionStatus.Published);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: MainSegmentEditionStatus.Published });
    req.flush({ ...sampleAdminResponse, status: MainSegmentEditionStatus.Published });
  });

  it('should open and close registration', () => {
    service.openRegistration(2026).subscribe();
    const openReq = httpMock.expectOne(`${baseUrl}/2026/registration/open`);
    expect(openReq.request.method).toBe('POST');
    openReq.flush(sampleAdminResponse);

    service.closeRegistration(2026).subscribe();
    const closeReq = httpMock.expectOne(`${baseUrl}/2026/registration/close`);
    expect(closeReq.request.method).toBe('POST');
    closeReq.flush(sampleAdminResponse);
  });

  it('should upload and delete hero image', () => {
    const mockFile = new File(['fake-image'], 'hero.png', { type: 'image/png' });

    service.uploadHeroImage(2026, mockFile).subscribe();
    const uploadReq = httpMock.expectOne(`${baseUrl}/2026/hero-image`);
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush(sampleAdminResponse);

    service.deleteHeroImage(2026).subscribe();
    const deleteReq = httpMock.expectOne(`${baseUrl}/2026/hero-image`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(sampleAdminResponse);
  });
});
