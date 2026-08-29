import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MainSegmentRegistrationModalComponent } from './main-segment-registration-modal';
import { AcademicDirectoryService } from '../../../core/services/academic-directory.service';
import {
  DEFAULT_REGISTRATION_SCHEMA,
  MainSegmentRegistrationService,
} from '../../../core/services/main-segment-registration.service';
import { RegistrationSubmissionResponse } from '../../../core/models/registration.model';

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
    status: 'Received',
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
    expect(component.submissionResponse$.value?.referenceNumber).toBe('REG-2026-XYZ987');
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
    expect(component.errorMessage$.value).toContain('already been submitted');

    mockRegService.submitRegistration.mockReturnValue(
      throwError(() => ({ status: 429, error: { message: 'Too many requests.' } }))
    );

    component.submitAll();
    expect(component.errorMessage$.value).toContain('Too many registration requests');
  });

  it('should emit closed when requestClose is called on clean or confirmed form', () => {
    const closedSpy = vi.spyOn(component.closed, 'emit');
    component.requestClose();
    expect(closedSpy).toHaveBeenCalled();
  });
});
