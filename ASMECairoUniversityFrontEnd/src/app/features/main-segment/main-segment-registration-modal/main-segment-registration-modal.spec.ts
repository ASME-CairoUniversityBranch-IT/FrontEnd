import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { MainSegmentRegistrationModalComponent } from './main-segment-registration-modal';
import { AcademicDirectoryService } from '../../../core/services/academic-directory.service';
import {
  DEFAULT_REGISTRATION_SCHEMA,
  MainSegmentRegistrationService,
} from '../../../core/services/main-segment-registration.service';
import { RegistrationQuestion, RegistrationSubmissionResponse } from '../../../core/models/registration.model';

describe('MainSegmentRegistrationModalComponent', () => {
  let component: MainSegmentRegistrationModalComponent;
  let fixture: ComponentFixture<MainSegmentRegistrationModalComponent>;
  let mockAcademicService: {
    getUniversities: ReturnType<typeof vi.fn>;
    getFaculties: ReturnType<typeof vi.fn>;
    getDepartments: ReturnType<typeof vi.fn>;
  };
  let mockRegService: {
    getRegistrationSchema: ReturnType<typeof vi.fn>;
    submitRegistration: ReturnType<typeof vi.fn>;
  };

  const sampleSubmissionResponse: RegistrationSubmissionResponse = {
    referenceNumber: 'REG-2026-XYZ987',
    status: 'Submitted',
    submittedAt: '2026-08-29T16:00:00Z',
    editionYear: 2026,
    message: 'Application registered.',
  };

  beforeEach(async () => {
    mockAcademicService = {
      getUniversities: vi.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'u-1',
              englishName: 'Cairo University',
              arabicName: 'جامعة القاهرة',
              category: 'Public',
              isOther: false,
              isActive: true,
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          hasNextPage: false,
        })
      ),
      getFaculties: vi.fn().mockReturnValue(
        of({
          items: [
            {
              offeringId: 'off-1',
              facultyId: 'fac-1',
              universityId: 'u-1',
              englishName: 'Faculty of Engineering',
              arabicName: 'كلية الهندسة',
              isOther: false,
              isActive: true,
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          hasNextPage: false,
        })
      ),
      getDepartments: vi.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'dep-1',
              offeringId: 'off-1',
              universityId: 'u-1',
              englishName: 'Mechanical Power',
              arabicName: 'هندسة القوى الميكانيكية',
              isOther: false,
              isActive: true,
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          hasNextPage: false,
        })
      ),
    };

    mockRegService = {
      getRegistrationSchema: vi.fn().mockReturnValue(of(DEFAULT_REGISTRATION_SCHEMA)),
      submitRegistration: vi.fn().mockReturnValue(of(sampleSubmissionResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [MainSegmentRegistrationModalComponent],
      providers: [
        { provide: AcademicDirectoryService, useValue: mockAcademicService },
        { provide: MainSegmentRegistrationService, useValue: mockRegService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainSegmentRegistrationModalComponent);
    component = fixture.componentInstance;
    component.year = 2026;
    component.editionTitle = 'Main Segment 2026';
    fixture.detectChanges();
  });

  it('should create and initialize on Step 1 with schema loaded', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep).toBe(1);
    expect(mockRegService.getRegistrationSchema).toHaveBeenCalledWith(2026);
    expect(mockAcademicService.getUniversities).toHaveBeenCalled();
  });

  it('should block navigation to Step 2 if Step 1 is invalid or files missing', () => {
    component.goToStep(2);
    expect(component.currentStep).toBe(1);
    expect(component.errorMessage$.value).toContain('personal details');

    // Populate valid details but without files
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });

    component.goToStep(2);
    expect(component.currentStep).toBe(1);
    expect(component.nationalIdFileError).toContain('required');

    // Attach valid mock files
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });

    component.goToStep(2);
    expect(component.currentStep).toBe(2);
  });

  it('should handle university, faculty, and department cascading selections', () => {
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    component.goToStep(2);

    const uni = {
      id: 'u-1',
      englishName: 'Cairo University',
      arabicName: 'جامعة القاهرة',
      category: 'Public',
      isOther: false,
      isActive: true,
    };
    component.selectUniversity(uni);
    expect(component.selectedUniversity?.id).toBe('u-1');
    expect(mockAcademicService.getFaculties).toHaveBeenCalledWith('u-1', '', 1, 50);

    const fac = {
      offeringId: 'off-1',
      facultyId: 'fac-1',
      universityId: 'u-1',
      englishName: 'Faculty of Engineering',
      arabicName: 'كلية الهندسة',
      isOther: false,
      isActive: true,
    };
    component.selectFaculty(fac);
    expect(component.selectedFaculty?.offeringId).toBe('off-1');
    expect(mockAcademicService.getDepartments).toHaveBeenCalledWith('off-1', '', 1, 50);

    const dept = {
      id: 'dep-1',
      offeringId: 'off-1',
      universityId: 'u-1',
      englishName: 'Mechanical Power',
      arabicName: 'هندسة القوى الميكانيكية',
      isOther: false,
      isActive: true,
    };
    component.selectDepartment(dept);
    expect(component.selectedDepartment?.id).toBe('dep-1');

    // Changing university should clear faculty & department
    component.selectUniversity('other');
    expect(component.isUniversityOther).toBe(true);
    expect(component.selectedFaculty).toBeNull();
    expect(component.selectedDepartment).toBeNull();
  });

  it('should validate Step 2 and proceed to Step 3', () => {
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    component.goToStep(2);

    component.educationForm.patchValue({
      universityId: 'u-1',
      facultyOfferingId: 'off-1',
      departmentId: 'dep-1',
      graduationYear: 2026,
    });
    component.universityIdFile = new File(['unid'], 'uni_id.png', { type: 'image/png' });

    component.goToStep(3);
    expect(component.currentStep).toBe(3);
  });

  it('should submit full registration and render reference on success', () => {
    // Step 1
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });

    // Step 2
    component.educationForm.patchValue({
      universityId: 'u-1',
      facultyOfferingId: 'off-1',
      departmentId: 'dep-1',
      graduationYear: 2026,
    });
    component.universityIdFile = new File(['unid'], 'uni_id.png', { type: 'image/png' });

    // Step 3
    component.questionsForm.patchValue({
      referral_source: 'SocialMedia',
      primary_interest: 'MechanicalDesign',
      join_asme_cu: true,
      asme_team_preference: 'Technical',
      expectations_goals: 'Learn about new technologies',
      consentAgreed: true,
    });

    component.submitAll();
    expect(mockRegService.submitRegistration).toHaveBeenCalledWith(2026, expect.anything());
    expect(mockRegService.submitRegistration).toHaveBeenCalledWith(
      2026,
      expect.objectContaining({
        schemaId: DEFAULT_REGISTRATION_SCHEMA.schemaId,
        idempotencyKey: expect.any(String),
        consentNoticeVersion: 'main-segment-2026-v1',
      })
    );
    expect(component.submissionResponse$.value?.referenceNumber).toBe('REG-2026-XYZ987');

    const persistedBrowserData = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
      .map((key) => localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? '')
      .join(' ');
    expect(persistedBrowserData).not.toContain('30101011234567');
    expect(persistedBrowserData).not.toContain('Learn about new technologies');
  });

  it('should prevent duplicate submission while the first request is pending', () => {
    const pendingSubmission = new Subject<RegistrationSubmissionResponse>();
    mockRegService.submitRegistration.mockReturnValue(pendingSubmission);
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    component.educationForm.patchValue({
      universityId: 'u-1',
      facultyOfferingId: 'off-1',
      departmentId: 'dep-1',
      graduationYear: 2026,
    });
    component.universityIdFile = new File(['unid'], 'uni_id.png', { type: 'image/png' });
    component.questionsForm.patchValue({
      referral_source: 'SocialMedia',
      primary_interest: 'MechanicalDesign',
      join_asme_cu: false,
      consentAgreed: true,
    });

    component.submitAll();
    component.submitAll();

    expect(mockRegService.submitRegistration).toHaveBeenCalledTimes(1);
  });

  it('should block the form and expose retry when the published schema cannot load', () => {
    mockRegService.getRegistrationSchema.mockReturnValue(
      throwError(() => ({ status: 404, error: { message: 'No published schema.' } }))
    );

    component.loadRegistrationSchema();
    fixture.detectChanges();

    expect(component.schema$.value).toBeNull();
    expect(component.schemaError$.value).toContain('not currently available');
    expect(fixture.nativeElement.querySelector('.reg-schema-state.error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.step-form')).toBeNull();
  });

  it('should handle conflict (409) and rate limit (429) errors gracefully', () => {
    component.detailsForm.patchValue({
      nameEnglish: 'Omar Tarek',
      nameArabic: 'عمر طارق',
      email: 'omar@example.com',
      phoneNumber: '01099887766',
      gender: 'Male',
      nationalId: '30101011234567',
    });
    component.nationalIdFile = new File(['id'], 'nid.jpg', { type: 'image/jpeg' });
    component.cvFile = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    component.educationForm.patchValue({
      universityId: 'u-1',
      facultyOfferingId: 'off-1',
      departmentId: 'dep-1',
      graduationYear: 2026,
    });
    component.universityIdFile = new File(['unid'], 'uni_id.png', { type: 'image/png' });
    component.questionsForm.patchValue({
      referral_source: 'SocialMedia',
      primary_interest: 'MechanicalDesign',
      join_asme_cu: false,
      consentAgreed: true,
    });

    mockRegService.submitRegistration.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'Duplicate applicant.' } }))
    );

    component.submitAll();
    expect(component.errorMessage$.value).toContain('Duplicate applicant');

    mockRegService.submitRegistration.mockReturnValue(
      throwError(() => ({ status: 429, error: { message: 'Too many requests.' } }))
    );

    component.submitAll();
    expect(component.errorMessage$.value).toContain('Too many registration requests');
    const firstKey = mockRegService.submitRegistration.mock.calls[0][1].idempotencyKey;
    const retryKey = mockRegService.submitRegistration.mock.calls[1][1].idempotencyKey;
    expect(retryKey).toBe(firstKey);
  });

  it('previews the supplied draft across all steps without loading or submitting a public schema', () => {
    mockRegService.getRegistrationSchema.mockClear();
    component.previewMode = true;
    component.previewSchema = { ...DEFAULT_REGISTRATION_SCHEMA, questions: [] };
    component.loadRegistrationSchema();
    component.goToStep(3);
    expect(component.currentStep).toBe(3);
    component.submitAll();
    expect(mockRegService.getRegistrationSchema).not.toHaveBeenCalled();
    expect(mockRegService.submitRegistration).not.toHaveBeenCalled();
    expect(component.schema$.value?.questions).toEqual([]);
    component.goToStep(2);
    expect(component.currentStep).toBe(2);
  });

  it('requires and serializes Other text, retains multichoice conditions, and omits unanswered optional YesNo', () => {
    const questions: RegistrationQuestion[] = [
      { id: 'choices', key: 'choices', title: 'Source', type: 'MultipleChoice', isRequired: true, options: [
        { id: 'known', label: 'Friend', value: 'friend' }, { id: 'other', label: 'Other', value: 'other', isOther: true },
      ] },
      { id: 'followup', key: 'followup', title: 'Which friend?', type: 'ShortText', isRequired: true, conditionalOnKey: 'choices', conditionalValue: 'friend' },
      { id: 'optional', key: 'optional', title: 'Optional', type: 'YesNo', isRequired: false },
    ];
    mockRegService.getRegistrationSchema.mockReturnValue(of({ ...DEFAULT_REGISTRATION_SCHEMA, questions }));
    component.loadRegistrationSchema();
    expect(component.isQuestionVisible(questions[1])).toBe(false);
    component.questionsForm.patchValue({ choices: ['other', 'friend'], followup: '   ', consentAgreed: true });
    expect(component.isQuestionVisible(questions[1])).toBe(true);
    expect(component.questionValidationMessage(questions[1])).toContain('required');
    expect(component.questionValidationMessage(questions[0])).toContain('Other');
    component.setOtherAnswer(questions[0], ' A student newsletter ');
    component.questionsForm.patchValue({ followup: 'A classmate' });
    expect(component.isQuestionsStepValid()).toBe(true);
    vi.spyOn(component, 'validateStep1').mockReturnValue(true);
    vi.spyOn(component, 'validateStep2').mockReturnValue(true);
    component.submitAll();
    const submission = mockRegService.submitRegistration.mock.calls[0][1];
    expect(submission.answers).toEqual([
      { questionId: 'choices', questionKey: 'choices', choiceAnswer: [{ value: 'other', otherText: 'A student newsletter' }, 'friend'] },
      { questionId: 'followup', questionKey: 'followup', answerText: 'A classmate' },
    ]);
  });

  it('clears hidden Other validators when academic parent selections change', () => {
    component.selectFaculty('other');
    component.selectDepartment('other');
    expect(component.educationForm.get('facultyOtherName')?.invalid).toBe(true);
    component.selectUniversity('other');
    expect(component.educationForm.get('facultyOtherName')?.valid).toBe(true);
    expect(component.educationForm.get('departmentOtherName')?.valid).toBe(true);
  });

  it('rejects a photo above the backend 5 MB limit before reading it', () => {
    const file = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 });
    component.onNationalIdFileSelected({ target: { files: [file], value: 'large.png' } } as unknown as Event);
    expect(component.nationalIdFile).toBeNull();
    expect(component.nationalIdFileError).toContain('5');
  });

  it('should emit closed when requestClose is called on clean or confirmed form', () => {
    const closedSpy = vi.spyOn(component.closed, 'emit');
    component.requestClose();
    expect(closedSpy).toHaveBeenCalled();
  });
});
