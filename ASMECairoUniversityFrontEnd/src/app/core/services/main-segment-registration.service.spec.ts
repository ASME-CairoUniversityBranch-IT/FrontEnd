import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  DEFAULT_REGISTRATION_SCHEMA,
  MainSegmentRegistrationService,
} from './main-segment-registration.service';
import {
  MainSegmentRegistrationSubmission,
  RegistrationSchema,
  RegistrationSubmissionResponse,
} from '../models/registration.model';
import { environment } from '../../../environments/environment';

describe('MainSegmentRegistrationService', () => {
  let service: MainSegmentRegistrationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/main-segments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MainSegmentRegistrationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MainSegmentRegistrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch registration schema from server', () => {
    const mockSchema: RegistrationSchema = {
      version: 2,
      consentNoticeVersion: '2026.2',
      questions: [],
    };

    service.getRegistrationSchema(2026).subscribe((res) => {
      expect(res.version).toBe(2);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSchema);
  });

  it('should fallback to default registration schema if endpoint fails', () => {
    service.getRegistrationSchema(2026).subscribe((res) => {
      expect(res.version).toBe(DEFAULT_REGISTRATION_SCHEMA.version);
      expect(res.questions.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    req.error(new ProgressEvent('error'));
  });

  it('should submit registration with files and data payload', () => {
    const mockSubmission: MainSegmentRegistrationSubmission = {
      nameEnglish: 'Ahmed Rabie',
      nameArabic: 'أحمد ربيع',
      email: 'ahmed@example.com',
      phoneNumber: '01012345678',
      gender: 'Male',
      nationalId: '30101011234567',
      universityId: 'u-1',
      universityName: 'Cairo University',
      graduationYear: 2026,
      schemaVersion: 1,
      consentNoticeVersion: '2026.1',
      answers: [],
      nationalIdPhoto: new File(['fake-id'], 'national_id.jpg', { type: 'image/jpeg' }),
      cvFile: new File(['fake-cv'], 'resume.pdf', { type: 'application/pdf' }),
      universityIdPhoto: new File(['fake-unid'], 'uni_id.png', { type: 'image/png' }),
    };

    const mockResponse: RegistrationSubmissionResponse = {
      referenceNumber: 'REG-2026-ABC123',
      status: 'Received',
      submittedAt: '2026-08-29T15:00:00Z',
      editionYear: 2026,
      message: 'Registration received successfully.',
    };

    service.submitRegistration(2026, mockSubmission).subscribe((res) => {
      expect(res.referenceNumber).toBe('REG-2026-ABC123');
      expect(res.status).toBe('Received');
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/registrations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });
});
