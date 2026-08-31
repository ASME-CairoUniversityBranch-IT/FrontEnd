import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  AcademicDepartmentItem,
  AcademicDirectoryService,
  AcademicFacultyItem,
  AcademicUniversityItem,
} from '../../../core/services/academic-directory.service';
import { MainSegmentRegistrationService } from '../../../core/services/main-segment-registration.service';
import { FocusTrapDirective } from '../../../shared/directives/focus-trap.directive';
import { egyptianNationalIdValidator } from '../../../core/validators/egyptian-national-id.validator';
import {
  MainSegmentRegistrationSubmission,
  RegistrationAnswerSubmission,
  RegistrationQuestion,
  RegistrationSchema,
  RegistrationSubmissionResponse,
} from '../../../core/models/registration.model';

export type RegistrationStep = 1 | 2 | 3;

@Component({
  selector: 'app-main-segment-registration-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FocusTrapDirective],
  templateUrl: './main-segment-registration-modal.html',
  styleUrl: './main-segment-registration-modal.css',
})
export class MainSegmentRegistrationModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) year!: number;
  @Input() editionTitle = 'Main Segment 2026';
  @Input() previewMode = false;
  @Input() previewSchema: RegistrationSchema | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly academicService = inject(AcademicDirectoryService);
  private readonly regService = inject(MainSegmentRegistrationService);
  private readonly destroy$ = new Subject<void>();
  private previousBodyOverflow = '';
  readonly otherAnswers: Record<string, string> = {};

  currentStep: RegistrationStep = 1;
  readonly isSubmitting$ = new BehaviorSubject<boolean>(false);
  private submissionKey: string | null = null;
  readonly submissionResponse$ = new BehaviorSubject<RegistrationSubmissionResponse | null>(null);
  readonly errorMessage$ = new BehaviorSubject<string | null>(null);

  // Schema state
  readonly schema$ = new BehaviorSubject<RegistrationSchema | null>(null);
  readonly isLoadingSchema$ = new BehaviorSubject<boolean>(true);
  readonly schemaError$ = new BehaviorSubject<string | null>(null);

  // Step 1 Form: Details
  readonly detailsForm: FormGroup = this.fb.group({
    nameEnglish: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s.'-]+$/)]],
    nameArabic: ['', [Validators.required, Validators.pattern(/^[\u0600-\u06FF\s.'-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^(01)[0125][0-9]{8}$/)]],
    gender: ['Male', [Validators.required]],
    nationalId: ['', [Validators.required, egyptianNationalIdValidator]],
  });

  // Step 2 Form: Education
  readonly educationForm: FormGroup = this.fb.group({
    universityId: ['', [Validators.required]],
    universityOtherName: [''],
    facultyOfferingId: ['', [Validators.required]],
    facultyOtherName: [''],
    departmentId: ['', [Validators.required]],
    departmentOtherName: [''],
    graduationYear: [
      new Date().getFullYear() + 2,
      [Validators.required, Validators.min(2020), Validators.max(2035)],
    ],
  });

  // Step 3 Form: Questions & Consent
  readonly questionsForm: FormGroup = this.fb.group({
    consentAgreed: [false, [Validators.requiredTrue]],
  });

  // Dynamic answers dictionary in memory
  dynamicAnswers: Record<string, any> = {};

  // Selected Files
  nationalIdFile: File | null = null;
  nationalIdPreviewUrl: string | null = null;
  nationalIdFileError: string | null = null;

  cvFile: File | null = null;
  cvFileName: string | null = null;
  cvFileError: string | null = null;

  universityIdFile: File | null = null;
  universityIdPreviewUrl: string | null = null;
  universityIdFileError: string | null = null;

  // Academic Directory Typeahead State
  readonly universitySearch$ = new BehaviorSubject<string>('');
  readonly universitiesList$ = new BehaviorSubject<AcademicUniversityItem[]>([]);
  readonly isLoadingUniversities$ = new BehaviorSubject<boolean>(false);
  selectedUniversity: AcademicUniversityItem | null = null;
  isUniversityOther = false;

  readonly facultySearch$ = new BehaviorSubject<string>('');
  readonly facultiesList$ = new BehaviorSubject<AcademicFacultyItem[]>([]);
  readonly isLoadingFaculties$ = new BehaviorSubject<boolean>(false);
  selectedFaculty: AcademicFacultyItem | null = null;
  isFacultyOther = false;

  readonly departmentSearch$ = new BehaviorSubject<string>('');
  readonly departmentsList$ = new BehaviorSubject<AcademicDepartmentItem[]>([]);
  readonly isLoadingDepartments$ = new BehaviorSubject<boolean>(false);
  selectedDepartment: AcademicDepartmentItem | null = null;
  isDepartmentOther = false;

  ngOnInit(): void {
    // Lock body scrolling
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this.loadRegistrationSchema();

    // Set up academic typeahead pipelines
    this.setupUniversitySearch();
    this.setupFacultySearch();
    this.setupDepartmentSearch();
  }

  loadRegistrationSchema(): void {
    if (this.previewMode) {
      this.schema$.next(this.previewSchema);
      this.initializeQuestionsForm(this.previewSchema?.questions ?? []);
      this.isLoadingSchema$.next(false);
      return;
    }
    this.isLoadingSchema$.next(true);
    this.schemaError$.next(null);
    this.regService
      .getRegistrationSchema(this.year)
      .pipe(
        takeUntil(this.destroy$),
        tap((schema) => {
          this.schema$.next(schema);
          this.isLoadingSchema$.next(false);
          this.initializeQuestionsForm(schema.questions);
        }),
        catchError((error) => {
          this.schema$.next(null);
          this.isLoadingSchema$.next(false);
          this.schemaError$.next(
            error?.status === 404 || error?.status === 409
              ? 'Registration is not currently available for this edition.'
              : 'The registration form could not be loaded. Please try again.'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    // Restore body scroll
    document.body.style.overflow = this.previousBodyOverflow;
    this.destroy$.next();
    this.destroy$.complete();
  }

  requestClose(): void {
    if (this.previewMode) { this.closed.emit(); return; }
    if (this.submissionResponse$.value) {
      this.closed.emit();
      return;
    }

    if (this.isFormDirty()) {
      const discard = confirm(
        'Are you sure you want to discard your registration? Any entered information will be discarded.'
      );
      if (!discard) return;
    }

    this.closed.emit();
  }

  private isFormDirty(): boolean {
    return (
      this.detailsForm.dirty ||
      this.educationForm.dirty ||
      this.questionsForm.dirty ||
      this.nationalIdFile !== null ||
      this.cvFile !== null ||
      this.universityIdFile !== null
    );
  }

  /* ── Step Navigation ── */
  goToStep(step: RegistrationStep): void {
    if (this.previewMode) { this.currentStep = step; this.errorMessage$.next(null); return; }
    if (step === 2) {
      if (!this.validateStep1()) return;
    } else if (step === 3) {
      if (!this.validateStep1() || !this.validateStep2()) return;
    }
    this.errorMessage$.next(null);
    this.currentStep = step;
  }

  validateStep1(): boolean {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      this.errorMessage$.next('Please fill in all required personal details correctly.');
      return false;
    }
    if (!this.nationalIdFile) {
      this.nationalIdFileError = 'National ID photo is required.';
      this.errorMessage$.next('National ID photo is required.');
      return false;
    }
    if (!this.cvFile) {
      this.cvFileError = 'CV document (PDF or DOCX) is required.';
      this.errorMessage$.next('CV document is required.');
      return false;
    }
    this.nationalIdFileError = null;
    this.cvFileError = null;
    this.errorMessage$.next(null);
    return true;
  }

  validateStep2(): boolean {
    if (this.educationForm.invalid) {
      this.educationForm.markAllAsTouched();
      this.errorMessage$.next('Please complete all required university and education fields.');
      return false;
    }
    if (!this.universityIdFile) {
      this.universityIdFileError = 'University ID card photo is required.';
      this.errorMessage$.next('University ID photo is required.');
      return false;
    }
    this.universityIdFileError = null;
    this.errorMessage$.next(null);
    return true;
  }

  /* ── File Selection Handlers ── */
  onNationalIdFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.nationalIdFileError = 'Please select a valid image file (JPEG, PNG, or WebP).';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      this.nationalIdFileError = 'National ID image must be a non-empty file up to 5 MB.';
      return;
    }

    this.nationalIdFile = file;
    this.nationalIdFileError = null;

    const reader = new FileReader();
    reader.onload = () => {
      this.nationalIdPreviewUrl = reader.result as string;
      this.changeDetector.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onCvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const lowerName = file.name.toLowerCase();
    const genericMime = !file.type || file.type === 'application/octet-stream';
    const isAllowed =
      (lowerName.endsWith('.pdf') && (genericMime || file.type === 'application/pdf')) ||
      (lowerName.endsWith('.docx') &&
        (genericMime ||
          file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));

    if (!isAllowed) {
      this.cvFileError = 'CV must be a PDF or DOCX file.';
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      this.cvFileError = 'CV document must be a non-empty file up to 10 MB.';
      return;
    }

    this.cvFile = file;
    this.cvFileName = file.name;
    this.cvFileError = null;
  }

  onUniversityIdFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.universityIdFileError = 'Please select a valid image file (JPEG, PNG, or WebP).';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      this.universityIdFileError = 'University ID image must be a non-empty file up to 5 MB.';
      return;
    }

    this.universityIdFile = file;
    this.universityIdFileError = null;

    const reader = new FileReader();
    reader.onload = () => {
      this.universityIdPreviewUrl = reader.result as string;
      this.changeDetector.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  /* ── Academic Directory Lookups ── */
  private setupUniversitySearch(): void {
    this.isLoadingUniversities$.next(true);
    this.academicService.getUniversities('', 1, 50).subscribe({
      next: (page) => {
        this.universitiesList$.next(page.items);
        this.isLoadingUniversities$.next(false);
      },
      error: () => this.isLoadingUniversities$.next(false),
    });

    this.universitySearch$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => this.isLoadingUniversities$.next(true)),
        switchMap((term) =>
          this.academicService.getUniversities(term, 1, 50).pipe(
            catchError(() => of({ items: [], page: 1, pageSize: 50, totalCount: 0, hasNextPage: false }))
          )
        )
      )
      .subscribe((page) => {
        this.universitiesList$.next(page.items);
        this.isLoadingUniversities$.next(false);
      });
  }

  private setupFacultySearch(): void {
    this.facultySearch$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!this.selectedUniversity || this.isUniversityOther) return of([]);
          const universityId = this.selectedUniversity.id;
          this.isLoadingFaculties$.next(true);
          return this.academicService.getFaculties(universityId, term, 1, 50).pipe(
            map((p) => p.items),
            catchError(() => of([])),
            filter(() => this.selectedUniversity?.id === universityId),
          );
        })
      )
      .subscribe((items) => {
        this.facultiesList$.next(items);
        this.isLoadingFaculties$.next(false);
      });
  }

  private setupDepartmentSearch(): void {
    this.departmentSearch$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!this.selectedFaculty || this.isFacultyOther) return of([]);
          const offeringId = this.selectedFaculty.offeringId;
          this.isLoadingDepartments$.next(true);
          return this.academicService.getDepartments(offeringId, term, 1, 50).pipe(
            map((p) => p.items),
            catchError(() => of([])),
            filter(() => this.selectedFaculty?.offeringId === offeringId),
          );
        })
      )
      .subscribe((items) => {
        this.departmentsList$.next(items);
        this.isLoadingDepartments$.next(false);
      });
  }

  selectUniversity(uni: AcademicUniversityItem | 'other'): void {
    this.clearFaculty();
    if (uni === 'other') {
      this.isUniversityOther = true;
      this.selectedUniversity = null;
      this.educationForm.patchValue({ universityId: 'other', universityOtherName: '' });
      this.educationForm.get('universityOtherName')?.setValidators([Validators.required]);
    } else {
      this.isUniversityOther = false;
      this.selectedUniversity = uni;
      this.educationForm.patchValue({ universityId: uni.id, universityOtherName: '' });
      this.educationForm.get('universityOtherName')?.clearValidators();
      // Load faculties
      this.loadFaculties(uni.id);
    }
    this.educationForm.get('universityOtherName')?.updateValueAndValidity();

  }

  private loadFaculties(uniId: string): void {
    this.isLoadingFaculties$.next(true);
    this.academicService.getFaculties(uniId, '', 1, 50).subscribe({
      next: (page) => {
        if (this.selectedUniversity?.id !== uniId) return;
        this.facultiesList$.next(page.items);
        this.isLoadingFaculties$.next(false);
      },
      error: () => {
        if (this.selectedUniversity?.id === uniId) this.isLoadingFaculties$.next(false);
      },
    });
  }

  selectFaculty(fac: AcademicFacultyItem | 'other'): void {
    this.clearDepartment();
    if (fac === 'other') {
      this.isFacultyOther = true;
      this.selectedFaculty = null;
      this.educationForm.patchValue({ facultyOfferingId: 'other', facultyOtherName: '' });
      this.educationForm.get('facultyOtherName')?.setValidators([Validators.required]);
    } else {
      this.isFacultyOther = false;
      this.selectedFaculty = fac;
      this.educationForm.patchValue({ facultyOfferingId: fac.offeringId, facultyOtherName: '' });
      this.educationForm.get('facultyOtherName')?.clearValidators();
      // Load departments
      this.loadDepartments(fac.offeringId);
    }
    this.educationForm.get('facultyOtherName')?.updateValueAndValidity();

  }

  private loadDepartments(offeringId: string): void {
    this.isLoadingDepartments$.next(true);
    this.academicService.getDepartments(offeringId, '', 1, 50).subscribe({
      next: (page) => {
        if (this.selectedFaculty?.offeringId !== offeringId) return;
        this.departmentsList$.next(page.items);
        this.isLoadingDepartments$.next(false);
      },
      error: () => {
        if (this.selectedFaculty?.offeringId === offeringId) this.isLoadingDepartments$.next(false);
      },
    });
  }

  selectDepartment(dept: AcademicDepartmentItem | 'other'): void {
    if (dept === 'other') {
      this.isDepartmentOther = true;
      this.selectedDepartment = null;
      this.educationForm.patchValue({ departmentId: 'other', departmentOtherName: '' });
      this.educationForm.get('departmentOtherName')?.setValidators([Validators.required]);
    } else {
      this.isDepartmentOther = false;
      this.selectedDepartment = dept;
      this.educationForm.patchValue({ departmentId: dept.id, departmentOtherName: '' });
      this.educationForm.get('departmentOtherName')?.clearValidators();
    }
    this.educationForm.get('departmentOtherName')?.updateValueAndValidity();
  }

  clearFaculty(): void {
    this.selectedFaculty = null;
    this.isFacultyOther = false;
    this.facultiesList$.next([]);
    this.educationForm.patchValue({ facultyOfferingId: '', facultyOtherName: '' });
    this.educationForm.get('facultyOtherName')?.clearValidators();
    this.educationForm.get('facultyOtherName')?.updateValueAndValidity();
    this.isLoadingFaculties$.next(false);
    this.clearDepartment();
  }

  clearDepartment(): void {
    this.selectedDepartment = null;
    this.isDepartmentOther = false;
    this.departmentsList$.next([]);
    this.educationForm.patchValue({ departmentId: '', departmentOtherName: '' });
    this.educationForm.get('departmentOtherName')?.clearValidators();
    this.educationForm.get('departmentOtherName')?.updateValueAndValidity();
    this.isLoadingDepartments$.next(false);
  }

  /* ── Dynamic Questions Initialization ── */
  private initializeQuestionsForm(questions: RegistrationQuestion[]): void {
    for (const controlName of Object.keys(this.questionsForm.controls)) {
      if (controlName !== 'consentAgreed') this.questionsForm.removeControl(controlName);
    }
    for (const q of questions) {
      if (q.type === 'YesNo') {
        this.questionsForm.addControl(q.key, this.fb.control(null));
      } else if (q.type === 'MultipleChoice') {
        this.questionsForm.addControl(q.key, this.fb.control([]));
      } else {
        this.questionsForm.addControl(q.key, this.fb.control(''));
      }
    }
  }

  isQuestionVisible(q: RegistrationQuestion): boolean {
    if (!q.conditionalOnKey) return true;
    const parentVal = this.questionsForm.get(q.conditionalOnKey)?.value;
    if (q.conditionalValue === true) {
      return parentVal === true || parentVal === 'true';
    }
    if (q.conditionalValue === false) {
      return parentVal === false || parentVal === 'false';
    }
    return Array.isArray(parentVal) ? parentVal.includes(q.conditionalValue) : parentVal === q.conditionalValue;
  }

  hasOtherAnswer(q: RegistrationQuestion): boolean {
    const value = this.questionsForm.get(q.key)?.value;
    return !!q.options?.some(option => option.isOther && (Array.isArray(value) ? value.includes(option.value) : value === option.value));
  }

  setOtherAnswer(q: RegistrationQuestion, value: string): void {
    this.otherAnswers[q.key] = value;
    this.questionsForm.get(q.key)?.markAsDirty();
  }

  isQuestionsStepValid(): boolean {
    if (!this.questionsForm.get('consentAgreed')?.value) {
      return false;
    }
    const schema = this.schema$.value;
    if (!schema) return true;
    for (const q of schema.questions) {
      if (!this.isQuestionVisible(q)) continue;
      if (this.questionValidationMessage(q)) return false;
    }
    return true;
  }

  questionValidationMessage(q: RegistrationQuestion): string | null {
    if (!this.isQuestionVisible(q)) return null;
    const value = this.questionsForm.get(q.key)?.value;
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);
    if (q.isRequired && isEmpty) return 'This question is required.';
    if (isEmpty) return null;
    if (this.hasOtherAnswer(q) && !this.otherAnswers[q.key]?.trim()) return 'Please specify your Other answer.';
    if (this.hasOtherAnswer(q) && this.otherAnswers[q.key]?.trim().length > 200) return 'Enter no more than 200 characters for Other.';

    if (typeof value === 'string') {
      if (q.minLength != null && value.trim().length < q.minLength) {
        return `Enter at least ${q.minLength} characters.`;
      }
      if (q.maxLength != null && value.length > q.maxLength) {
        return `Enter no more than ${q.maxLength} characters.`;
      }
    }
    if (Array.isArray(value)) {
      if (q.minSelections != null && value.length < q.minSelections) {
        return `Select at least ${q.minSelections} options.`;
      }
      if (q.maxSelections != null && value.length > q.maxSelections) {
        return `Select no more than ${q.maxSelections} options.`;
      }
    }
    return null;
  }

  onCheckboxOptionToggled(questionKey: string, optionValue: string): void {
    const control = this.questionsForm.get(questionKey);
    const current = (control?.value || []) as string[];
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    control?.setValue(next);
    control?.markAsDirty();
  }

  /* ── Final Submission ── */
  submitAll(): void {
    if (this.previewMode) return;
    if (this.isSubmitting$.value) return;
    if (!this.validateStep1() || !this.validateStep2()) return;

    if (!this.isQuestionsStepValid()) {
      this.questionsForm.markAllAsTouched();
      this.errorMessage$.next('Please answer all required questions and accept the consent notice.');
      return;
    }

    const schema = this.schema$.value;
    if (!schema) {
      this.errorMessage$.next('The registration form changed. Reload it before submitting.');
      return;
    }
    const answers: RegistrationAnswerSubmission[] = [];

    if (schema) {
      for (const q of schema.questions) {
        if (!this.isQuestionVisible(q)) continue;
        const val = this.questionsForm.get(q.key)?.value;
        if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) continue;
        if (q.type === 'YesNo') {
          answers.push({
            questionId: q.id,
            questionKey: q.key,
            booleanAnswer: val === true || val === 'true',
          });
        } else if (q.type === 'MultipleChoice' || q.type === 'SingleChoice') {
          const values: string[] = Array.isArray(val) ? val : [val];
          const choices = values.map(value => q.options?.some(option => option.value === value && option.isOther)
            ? { value, otherText: this.otherAnswers[q.key]?.trim() || '' } : value);
          answers.push({
            questionId: q.id,
            questionKey: q.key,
            choiceAnswer: q.type === 'MultipleChoice' ? choices : choices[0],
          });
        } else {
          answers.push({
            questionId: q.id,
            questionKey: q.key,
            answerText: val ? String(val).trim() : null,
          });
        }
      }
    }

    const details = this.detailsForm.value;
    const education = this.educationForm.value;

    const submission: MainSegmentRegistrationSubmission = {
      idempotencyKey: (this.submissionKey ??= this.createSubmissionKey()),
      schemaId: schema.schemaId,
      nameEnglish: details.nameEnglish.trim(),
      nameArabic: details.nameArabic.trim(),
      email: details.email.trim().toLowerCase(),
      phoneNumber: details.phoneNumber.trim(),
      gender: details.gender,
      nationalId: details.nationalId.trim(),

      universityId: this.isUniversityOther ? 'other' : education.universityId,
      universityName: this.selectedUniversity?.englishName || null,
      universityOtherName: this.isUniversityOther ? education.universityOtherName?.trim() : null,
      isUniversityOther: this.isUniversityOther,

      facultyOfferingId: this.isFacultyOther ? 'other' : education.facultyOfferingId,
      facultyName: this.selectedFaculty?.englishName || null,
      facultyOtherName: this.isFacultyOther ? education.facultyOtherName?.trim() : null,
      isFacultyOther: this.isFacultyOther,

      departmentId: this.isDepartmentOther ? 'other' : education.departmentId,
      departmentName: this.selectedDepartment?.englishName || null,
      departmentOtherName: this.isDepartmentOther ? education.departmentOtherName?.trim() : null,
      isDepartmentOther: this.isDepartmentOther,

      graduationYear: Number(education.graduationYear),

      schemaVersion: schema.version,
      consentNoticeVersion: schema.consentNoticeVersion,
      answers,

      nationalIdPhoto: this.nationalIdFile!,
      cvFile: this.cvFile!,
      universityIdPhoto: this.universityIdFile!,
    };

    this.isSubmitting$.next(true);
    this.errorMessage$.next(null);

    this.regService.submitRegistration(this.year, submission).subscribe({
      next: (res) => {
        this.isSubmitting$.next(false);
        this.submissionResponse$.next(res);
      },
      error: (err) => {
        this.isSubmitting$.next(false);
        if (err.status === 409) {
          this.errorMessage$.next(
            err?.error?.message || err?.error?.Message ||
              'Registration could not be accepted because the form or event availability changed.'
          );
        } else if (err.status === 429) {
          this.errorMessage$.next(
            'Too many registration requests. Please wait a moment before trying again.'
          );
        } else if (err?.error?.message || err?.error?.Message) {
          this.errorMessage$.next(err.error.message || err.error.Message);
        } else {
          this.errorMessage$.next(
            'Failed to submit registration. Please verify all information and retry.'
          );
        }
      },
    });
  }

  private createSubmissionKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `main-segment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
