import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  MainSegmentRegistrationService,
} from './main-segment-registration.service';
import {
  MainSegmentRegistrationSubmission,
  RegistrationSubmissionResponse,
} from '../models/registration.model';
import { environment } from '../../../environments/environment';

describe('MainSegmentRegistrationService', () => {
  let service: MainSegmentRegistrationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/main-segments`;

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
    const mockSchema = {
      id: 'schema-2',
      schemaId: 'schema-2',
      editionYear: 2026,
      version: 2,
      publishedAt: '2026-08-29T15:00:00Z',
      questions: [
        {
          id: 'q-1',
          key: 'join_team',
          prompt: 'Join the team?',
          helperText: 'Choose yes or no.',
          type: 'YesNo',
          isRequired: true,
          displayOrder: 1,
          minLength: 2,
          maxLength: 20,
          condition: null,
          options: [],
        },
        {
          id: 'q-2',
          key: 'team',
          prompt: 'Which team?',
          helperText: null,
          type: 'SingleChoice',
          isRequired: true,
          displayOrder: 2,
          condition: { dependsOnQuestionId: 'q-1', expectedValue: 'yes' },
          options: [
            { id: 'inactive', value: 'old', label: 'Old', isOther: false, isActive: false, displayOrder: 1 },
            { id: 'active', value: 'technical', label: 'Technical', isOther: false, isActive: true, displayOrder: 2 },
          ],
        },
      ],
    };

    service.getRegistrationSchema(2026).subscribe((res) => {
      expect(res.version).toBe(2);
      expect(res.schemaId).toBe('schema-2');
      expect(res.questions[0].title).toBe('Join the team?');
      expect(res.questions[0].minLength).toBe(2);
      expect(res.questions[0].maxLength).toBe(20);
      expect(res.questions[1].conditionalOnKey).toBe('join_team');
      expect(res.questions[1].conditionalValue).toBe(true);
      expect(res.questions[1].options).toEqual([
        { id: 'active', value: 'technical', label: 'Technical' },
      ]);
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSchema);
  });

  it('should surface schema endpoint failures instead of presenting a fake form', () => {
    const errorSpy = vi.fn();
    service.getRegistrationSchema(2026).subscribe({ error: errorSpy });

    const req = httpMock.expectOne(`${baseUrl}/2026/registration-schema`);
    req.flush({ message: 'No published schema.' }, { status: 404, statusText: 'Not Found' });
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('should submit registration with files and data payload', () => {
    const mockSubmission: MainSegmentRegistrationSubmission = {
      idempotencyKey: 'qa-registration-1',
      schemaId: '11111111-1111-1111-1111-111111111111',
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
      status: 'Submitted',
      submittedAt: '2026-08-29T15:00:00Z',
      editionYear: 2026,
      message: 'Registration received successfully.',
    };

    service.submitRegistration(2026, mockSubmission).subscribe((res) => {
      expect(res.referenceNumber).toBe('REG-2026-ABC123');
      expect(res.status).toBe('Submitted');
    });

    const req = httpMock.expectOne(`${baseUrl}/2026/registrations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.headers.get('Idempotency-Key')).toBe('qa-registration-1');
    const formData = req.request.body as FormData;
    const payload = JSON.parse(String(formData.get('payload')));
    expect(payload).toEqual(
      expect.objectContaining({
        schemaId: '11111111-1111-1111-1111-111111111111',
        schemaVersion: 1,
        privacyNoticeVersion: '2026.1',
        privacyNoticeAccepted: true,
        personal: expect.objectContaining({ nationalIdNumber: '30101011234567' }),
        academic: expect.objectContaining({ universityId: 'u-1', graduationYear: 2026 }),
        answers: {},
      })
    );
    expect(formData.get('data')).toBeNull();
    req.flush(mockResponse);
  });
});
