import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, Subject, of, EMPTY } from 'rxjs';
import { catchError, expand, map, reduce, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AdminNavComponent } from '../../../../shared/components/admin-nav/admin-nav';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { MainSegmentRegistrationModalComponent } from '../../../main-segment/main-segment-registration-modal/main-segment-registration-modal';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import {
  AcademicDirectoryService,
  AcademicFacultyItem,
  AcademicUniversityItem,
} from '../../../../core/services/academic-directory.service';
import { ComponentCanDeactivate } from '../../../../core/guards/pending-changes.guard';
import {
  MainSegmentAdminOrganizationResponse,
  MainSegmentAdminPersonResponse,
  MainSegmentAdminProgramItemResponse,
  MainSegmentAdminResponse,
  MainSegmentAdminSectionResponse,
  MainSegmentEditionStatus,
  MainSegmentOrganizationCategory,
  MainSegmentOrganizationRequest,
  MainSegmentPersonRequest,
  MainSegmentProgramCategory,
  MainSegmentProgramItemRequest,
  MainSegmentSectionKey,
  MainSegmentSectionRequest,
  SponsorshipTier,
  UpdateMainSegmentEditionRequest,
} from '../../../../core/models/main-segment.model';
import {
  AdminRegistrationDetailResponse,
  AdminRegistrationDocumentDetail,
  AdminRegistrationListResponse,
  AdminRegistrationQuestion,
  AdminRegistrationSchemaResponse,
  DEFAULT_ADMIN_SCHEMA,
  PrivateDocumentType,
  RegistrationListFilterParams,
  RegistrationQuestionOption,
  RegistrationQuestionType,
  RegistrationSettings,
  RegistrationSchema,
  RegistrationStatus,
  UpdateRegistrationSchemaRequest,
  UpdateRegistrationStatusRequest,
} from '../../../../core/models/registration.model';
import {
  getOrgInitials,
  getPersonInitials,
  getSectionDisplayTitle,
  getSectionEyebrow,
  groupSponsorsByTier,
  toInputDateTime,
  toIsoDateTime,
} from '../../../../core/utils/main-segment.util';

export type WorkspaceTab = 'overview' | 'program' | 'companies' | 'form-builder' | 'registrations';

export interface WorkspaceVM {
  status: 'loading' | 'error' | 'loaded';
  edition?: MainSegmentAdminResponse;
  errorMessage?: string;
}

@Component({
  selector: 'app-admin-main-segment-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    AdminNavComponent,
    FocusTrapDirective,
    MainSegmentRegistrationModalComponent,
  ],
  templateUrl: './admin-main-segment-workspace.html',
  styleUrl: './admin-main-segment-workspace.css',
})
export class AdminMainSegmentWorkspaceComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminMainSegmentService);
  private readonly academicDirectoryService = inject(AcademicDirectoryService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  activeTab: WorkspaceTab = 'overview';
  year = 0;

  readonly vm$ = new BehaviorSubject<WorkspaceVM>({ status: 'loading' });
  readonly isSaving$ = new BehaviorSubject<boolean>(false);
  readonly isUploadingImage$ = new BehaviorSubject<boolean>(false);
  readonly heroImageError$ = new BehaviorSubject<string | null>(null);

  readonly successMessage$ = new BehaviorSubject<string | null>(null);
  readonly errorMessage$ = new BehaviorSubject<string | null>(null);

  /* ── Modals & Editor States ── */
  readonly isProgramItemModalOpen$ = new BehaviorSubject<boolean>(false);
  editingProgramItemId: string | null = null;
  readonly programItemForm: FormGroup = this.fb.group({
    category: [MainSegmentProgramCategory.Talk, [Validators.required]],
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    startsAt: [''],
    endsAt: [''],
    location: [''],
    isVisible: [true],
    personIds: [[] as string[]],
  });

  readonly isPersonModalOpen$ = new BehaviorSubject<boolean>(false);
  editingPersonId: string | null = null;
  readonly personForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    jobTitle: ['', [Validators.required]],
    shortBio: ['', [Validators.required]],
    linkedInUrl: [''],
    programItemIds: [[] as string[]],
  });

  readonly isOrgModalOpen$ = new BehaviorSubject<boolean>(false);
  editingOrgId: string | null = null;
  readonly orgForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    category: [MainSegmentOrganizationCategory.Sponsor, [Validators.required]],
    websiteUrl: [''],
    sponsorTier: ['Platinum'],
    isVisible: [true],
  });

  /* ── Registration Form Builder State (Milestone 6) ── */
  readonly schema$ = new BehaviorSubject<AdminRegistrationSchemaResponse | null>(null);
  readonly isLoadingSchema$ = new BehaviorSubject<boolean>(false);
  readonly schemaError$ = new BehaviorSubject<string | null>(null);
  readonly isSavingSchema$ = new BehaviorSubject<boolean>(false);
  readonly isSchemaPreviewOpen$ = new BehaviorSubject<boolean>(false);
  schemaPreview: RegistrationSchema | null = null;
  schemaDirty = false;
  questionEditorError: string | null = null;

  readonly schemaSettingsForm: FormGroup = this.fb.group({
    minGraduationYear: [2020, [Validators.required, Validators.min(1990), Validators.max(2040)]],
    maxGraduationYear: [2035, [Validators.required, Validators.min(1990), Validators.max(2050)]],
    eligibilityText: [''],
    privacyNoticeVersion: ['2026.1', [Validators.required]],
    privacyNoticeUrl: [''],
    submissionWorkflow: ['ReviewFirst', [Validators.required]],
  });

  readonly isQuestionModalOpen$ = new BehaviorSubject<boolean>(false);
  editingQuestionId: string | null = null;
  readonly questionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    key: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-z0-9_-]+$/)]],
    description: [''],
    type: ['ShortText', [Validators.required]],
    placeholder: [''],
    maxLength: [null],
    isRequired: [true],
    isActive: [true],
    allowOther: [false],
    hasCondition: [false],
    conditionalOnKey: [''],
    conditionalValue: [''],
    options: this.fb.array([]),
  });

  get questionOptionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  /* ── Registrations Review & Export State (Milestone 7) ── */
  readonly registrations$ = new BehaviorSubject<AdminRegistrationListResponse | null>(null);
  readonly isLoadingRegistrations$ = new BehaviorSubject<boolean>(false);
  readonly registrationLoadState$ = new BehaviorSubject<
    'idle' | 'loading' | 'loaded' | 'empty' | 'forbidden' | 'error'
  >('idle');
  readonly registrationErrorMessage$ = new BehaviorSubject<string | null>(null);
  readonly isExporting$ = new BehaviorSubject<boolean>(false);
  readonly downloadingDocument$ = new BehaviorSubject<PrivateDocumentType | null>(null);
  readonly registrationUniversities$ = new BehaviorSubject<AcademicUniversityItem[]>([]);
  readonly registrationFaculties$ = new BehaviorSubject<AcademicFacultyItem[]>([]);

  regSearch = '';
  regSearchInput = '';
  readonly registrationGraduationYears = Array.from({ length: 71 }, (_, index) => new Date().getFullYear() + 10 - index);
  regStatusFilter: RegistrationStatus | 'All' = 'All';
  regUniversityIdFilter = '';
  regFacultyIdFilter = '';
  regGradYearFilter: number | null = null;
  regSubmittedFrom = '';
  regSubmittedTo = '';
  regPage = 1;
  regPageSize = 10;
  private registrationLoadSequence = 0;
  private documentRequestSequence = 0;
  private registrationDetailSequence = 0;

  readonly isDetailModalOpen$ = new BehaviorSubject<boolean>(false);
  readonly selectedRegistration$ = new BehaviorSubject<AdminRegistrationDetailResponse | null>(
    null,
  );
  readonly registrationDetailError$ = new BehaviorSubject<string | null>(null);
  readonly isLoadingDetail$ = new BehaviorSubject<boolean>(false);
  readonly isUpdatingStatus$ = new BehaviorSubject<boolean>(false);
  selectedRegistrationId: string | null = null;

  readonly statusUpdateForm: FormGroup = this.fb.group({
    status: ['Submitted', [Validators.required]],
    note: [''],
  });

  // Controlled Private Document Lightbox
  readonly documentViewer$ = new BehaviorSubject<{
    isOpen: boolean;
    title: string;
    objectUrl: string | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    title: '',
    objectUrl: null,
    isLoading: false,
    error: null,
  });

  /* ── Filter Categories ── */
  programFilter = 'All';
  orgFilter = 'All';

  readonly form: FormGroup = this.fb.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    title: ['', [Validators.required]],
    heroContent: ['', [Validators.required]],
    storyContent: ['', [Validators.required]],
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    location: ['', [Validators.required]],
    careerFairIntro: [''],
    cvReviewAndMockInterviewsIntro: [''],
    registrationOpensAt: [''],
    registrationClosesAt: [''],
    capacity: [null, [Validators.min(1)]],
    registrationAvailabilityOverride: [null],
    sections: this.fb.array([]),
  });

  get sectionsArray(): FormArray {
    return this.form.get('sections') as FormArray;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        map((params) => Number(params.get('year'))),
        switchMap((year) => {
          if (!year || isNaN(year)) {
            this.vm$.next({
              status: 'error',
              errorMessage: 'Invalid Main Segment edition year.',
            });
            return of(null);
          }
          this.year = year;
          return this.loadEdition(year);
        }),
      )
      .subscribe();

    this.questionForm.get('type')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      if (type === 'SingleChoice' || type === 'MultipleChoice') {
        this.questionOptionsArray.enable({ emitEvent: false });
      } else {
        this.questionOptionsArray.disable({ emitEvent: false });
      }
    });

    // Adjust sponsorTier requirement when category changes
    this.orgForm.get('category')?.valueChanges.subscribe((cat) => {
      const tierCtrl = this.orgForm.get('sponsorTier');
      if (cat === MainSegmentOrganizationCategory.Sponsor) {
        tierCtrl?.setValidators([Validators.required]);
      } else {
        tierCtrl?.clearValidators();
      }
      tierCtrl?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.registrationLoadSequence++;
    this.documentRequestSequence++;
    this.registrationDetailSequence++;
    this.revokeDocumentUrl();
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): boolean {
    if (this.form.dirty || this.schemaSettingsForm.dirty || this.schemaDirty) {
      return confirm(
        'You have unsaved changes in this edition workspace. Are you sure you want to navigate away?',
      );
    }
    return true;
  }

  setTab(tab: WorkspaceTab): void {
    this.closeSchemaPreview();
    this.closeQuestionModal();
    if (tab !== 'registrations') this.closeRegistrationDetail();
    this.errorMessage$.next(null);
    this.successMessage$.next(null);
    this.activeTab = tab;
    if (tab === 'form-builder' && !this.schema$.value) {
      this.loadSchema(this.year);
    } else if (tab === 'registrations') {
      if (this.registrationUniversities$.value.length === 0) {
        this.loadRegistrationUniversityFilters();
      }
      if (!this.registrations$.value) {
        this.loadRegistrations();
      }
    }
  }

  setProgramFilter(filter: string): void {
    this.programFilter = filter;
  }

  setOrgFilter(filter: string): void {
    this.orgFilter = filter;
  }

  loadEdition(year: number): Observable<MainSegmentAdminResponse | null> {
    this.vm$.next({ status: 'loading' });
    this.errorMessage$.next(null);

    return this.adminService.getAdminByYear(year).pipe(
      tap((edition) => {
        this.populateForm(edition);
        this.vm$.next({ status: 'loaded', edition });
      }),
      catchError((err) => {
        const msg = err?.error?.message || `Failed to load Main Segment ${year}.`;
        this.vm$.next({ status: 'error', errorMessage: msg });
        return of(null);
      }),
    );
  }

  populateForm(edition: MainSegmentAdminResponse): void {
    this.form.patchValue({
      slug: edition.slug,
      title: edition.title,
      heroContent: edition.heroContent,
      storyContent: edition.storyContent,
      startsAt: toInputDateTime(edition.startsAt),
      endsAt: toInputDateTime(edition.endsAt),
      location: edition.location,
      careerFairIntro: edition.careerFairIntro || '',
      cvReviewAndMockInterviewsIntro: edition.cvReviewAndMockInterviewsIntro || '',
      registrationOpensAt: toInputDateTime(edition.registrationOpensAt),
      registrationClosesAt: toInputDateTime(edition.registrationClosesAt),
      capacity: edition.capacity,
      registrationAvailabilityOverride: edition.registrationAvailabilityOverride,
    });

    // Populate sections array
    this.sectionsArray.clear();
    const sections = edition.sections || [];
    for (const sec of sections) {
      this.sectionsArray.push(
        this.fb.group({
          sectionKey: [sec.sectionKey],
          isVisible: [sec.isVisible],
          displayOrder: [sec.displayOrder],
        }),
      );
    }

    this.form.markAsPristine();
  }

  /* ── Overview & Story Actions ── */
  saveDraft(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage$.next('Please fill in all required fields marked in red.');
      return;
    }

    const val = this.form.value;
    const request: UpdateMainSegmentEditionRequest = {
      slug: val.slug.trim(),
      title: val.title.trim(),
      heroContent: val.heroContent.trim(),
      storyContent: val.storyContent.trim(),
      startsAt: toIsoDateTime(val.startsAt) || new Date().toISOString(),
      endsAt: toIsoDateTime(val.endsAt) || new Date().toISOString(),
      location: val.location.trim(),
      careerFairIntro: val.careerFairIntro ? val.careerFairIntro.trim() : null,
      cvReviewAndMockInterviewsIntro: val.cvReviewAndMockInterviewsIntro
        ? val.cvReviewAndMockInterviewsIntro.trim()
        : null,
      registrationOpensAt: toIsoDateTime(val.registrationOpensAt),
      registrationClosesAt: toIsoDateTime(val.registrationClosesAt),
      capacity: val.capacity ? Number(val.capacity) : null,
      registrationAvailabilityOverride:
        val.registrationAvailabilityOverride === 'true'
          ? true
          : val.registrationAvailabilityOverride === 'false'
            ? false
            : null,
      sections: val.sections.map((s: MainSegmentSectionRequest) => ({
        sectionKey: s.sectionKey,
        isVisible: Boolean(s.isVisible),
        displayOrder: Number(s.displayOrder),
      })),
    };

    this.isSaving$.next(true);
    this.errorMessage$.next(null);
    this.successMessage$.next(null);

    this.adminService.updateEdition(this.year, request).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.populateForm(updated);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Edition draft successfully saved.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(
          err?.error?.message || 'Failed to save edition changes. Please verify fields.',
        );
      },
    });
  }

  onHeroImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // Clear the native selection so choosing the same file after a failure retries it.
    input.value = '';
    if (this.isUploadingImage$.value) return;

    this.heroImageError$.next(null);
    this.errorMessage$.next(null);
    this.successMessage$.next(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.heroImageError$.next('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      this.heroImageError$.next(file.size === 0 ? 'This image file is empty.' : 'Choose an image no larger than 5 MB.');
      return;
    }

    this.isUploadingImage$.next(true);

    this.adminService.uploadHeroImage(this.year, file).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Hero visual uploaded successfully.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.heroImageError$.next(err?.error?.message || 'Failed to upload hero image. Please try again.');
      },
    });
  }

  removeHeroImage(): void {
    if (this.isUploadingImage$.value) return;
    if (!confirm('Are you sure you want to remove the hero visual?')) return;

    this.heroImageError$.next(null);
    this.isUploadingImage$.next(true);
    this.errorMessage$.next(null);

    this.adminService.deleteHeroImage(this.year).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Hero visual removed.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.heroImageError$.next(err?.error?.message || 'Failed to remove hero image.');
      },
    });
  }

  togglePublishStatus(currentStatus: MainSegmentEditionStatus): void {
    const nextStatus =
      currentStatus === MainSegmentEditionStatus.Published
        ? MainSegmentEditionStatus.Draft
        : MainSegmentEditionStatus.Published;

    const actionName = nextStatus === MainSegmentEditionStatus.Published ? 'publish' : 'unpublish';
    if (!confirm(`Are you sure you want to ${actionName} this edition?`)) return;

    this.isSaving$.next(true);
    this.errorMessage$.next(null);

    this.adminService.setStatus(this.year, nextStatus).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess(`Edition is now ${updated.status}.`);
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || `Failed to update status to ${nextStatus}.`);
      },
    });
  }

  toggleArchiveStatus(currentStatus: MainSegmentEditionStatus): void {
    const isArchived = currentStatus === MainSegmentEditionStatus.Archived;
    const nextStatus = isArchived
      ? MainSegmentEditionStatus.Draft
      : MainSegmentEditionStatus.Archived;

    const actionName = isArchived ? 'unarchive' : 'archive';
    if (!confirm(`Are you sure you want to ${actionName} this edition?`)) return;

    this.isSaving$.next(true);
    this.errorMessage$.next(null);

    this.adminService.setStatus(this.year, nextStatus).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess(`Edition is now ${updated.status}.`);
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || `Failed to ${actionName} edition.`);
      },
    });
  }

  toggleRegistration(isAvailable: boolean): void {
    this.isSaving$.next(true);
    this.errorMessage$.next(null);

    const obs$ = isAvailable
      ? this.adminService.closeRegistration(this.year)
      : this.adminService.openRegistration(this.year);

    obs$.subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess(
          `Registration is now ${updated.isRegistrationAvailable ? 'OPEN' : 'CLOSED'}.`,
        );
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(
          err?.error?.message || 'Failed to update registration availability.',
        );
      },
    });
  }

  /* ── Program Items CRUD & Reorder ── */
  openAddProgramItemModal(): void {
    this.editingProgramItemId = null;
    this.programItemForm.reset({
      category: MainSegmentProgramCategory.Talk,
      title: '',
      description: '',
      startsAt: '',
      endsAt: '',
      location: '',
      isVisible: true,
      personIds: [],
    });
    this.isProgramItemModalOpen$.next(true);
  }

  openEditProgramItemModal(item: MainSegmentAdminProgramItemResponse): void {
    this.editingProgramItemId = item.id;
    this.programItemForm.patchValue({
      category: item.category,
      title: item.title,
      description: item.description,
      startsAt: toInputDateTime(item.startsAt),
      endsAt: toInputDateTime(item.endsAt),
      location: item.location || '',
      isVisible: item.isVisible,
      personIds: item.personIds || [],
    });
    this.isProgramItemModalOpen$.next(true);
  }

  closeProgramItemModal(): void {
    this.isProgramItemModalOpen$.next(false);
    this.editingProgramItemId = null;
  }

  saveProgramItem(): void {
    if (this.programItemForm.invalid) {
      this.programItemForm.markAllAsTouched();
      return;
    }

    const val = this.programItemForm.value;
    const request: MainSegmentProgramItemRequest = {
      category: val.category,
      title: val.title.trim(),
      description: val.description.trim(),
      startsAt: toIsoDateTime(val.startsAt),
      endsAt: toIsoDateTime(val.endsAt),
      location: val.location ? val.location.trim() : null,
      isVisible: Boolean(val.isVisible),
      personIds: val.personIds || [],
    };

    this.isSaving$.next(true);
    const obs$ = this.editingProgramItemId
      ? this.adminService.updateProgramItem(this.year, this.editingProgramItemId, request)
      : this.adminService.createProgramItem(this.year, request);

    obs$.subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.closeProgramItemModal();
        this.showSuccess('Program item saved successfully.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to save program item.');
      },
    });
  }

  deleteProgramItem(itemId: string): void {
    if (!confirm('Are you sure you want to delete this program item?')) return;

    this.isSaving$.next(true);
    this.adminService.deleteProgramItem(this.year, itemId).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Program item deleted.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to delete program item.');
      },
    });
  }

  moveProgramItem(
    currentIndex: number,
    direction: 'up' | 'down',
    items: MainSegmentAdminProgramItemResponse[],
  ): void {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const ids = copy.map((i) => i.id);
    this.adminService.reorderProgramItems(this.year, ids).subscribe({
      next: (updated) => {
        this.vm$.next({ status: 'loaded', edition: updated });
      },
      error: (err) => {
        this.errorMessage$.next(err?.error?.message || 'Failed to reorder program items.');
      },
    });
  }

  /* ── People / Speakers CRUD & Reorder ── */
  openAddPersonModal(): void {
    this.editingPersonId = null;
    this.personForm.reset({
      name: '',
      jobTitle: '',
      shortBio: '',
      linkedInUrl: '',
      programItemIds: [],
    });
    this.isPersonModalOpen$.next(true);
  }

  openEditPersonModal(person: MainSegmentAdminPersonResponse): void {
    this.editingPersonId = person.id;
    this.personForm.patchValue({
      name: person.name,
      jobTitle: person.jobTitle,
      shortBio: person.shortBio,
      linkedInUrl: person.linkedInUrl || '',
      programItemIds: person.programItemIds || [],
    });
    this.isPersonModalOpen$.next(true);
  }

  closePersonModal(): void {
    this.isPersonModalOpen$.next(false);
    this.editingPersonId = null;
  }

  savePerson(): void {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      return;
    }

    const val = this.personForm.value;
    const request: MainSegmentPersonRequest = {
      name: val.name.trim(),
      jobTitle: val.jobTitle.trim(),
      shortBio: val.shortBio.trim(),
      linkedInUrl: val.linkedInUrl ? val.linkedInUrl.trim() : null,
      programItemIds: val.programItemIds || [],
    };

    this.isSaving$.next(true);
    const obs$ = this.editingPersonId
      ? this.adminService.updatePerson(this.year, this.editingPersonId, request)
      : this.adminService.createPerson(this.year, request);

    obs$.subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.closePersonModal();
        this.showSuccess('Speaker profile saved.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to save speaker.');
      },
    });
  }

  deletePerson(personId: string): void {
    if (!confirm('Are you sure you want to delete this speaker profile?')) return;

    this.isSaving$.next(true);
    this.adminService.deletePerson(this.year, personId).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Speaker profile deleted.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to delete speaker.');
      },
    });
  }

  onPersonPhotoSelected(personId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.isUploadingImage$.next(true);
    this.adminService.uploadPersonPhoto(this.year, personId, file).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Speaker photo uploaded.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to upload speaker photo.');
      },
    });
  }

  removePersonPhoto(personId: string): void {
    if (!confirm('Remove speaker photo?')) return;

    this.isUploadingImage$.next(true);
    this.adminService.deletePersonPhoto(this.year, personId).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Speaker photo removed.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to remove speaker photo.');
      },
    });
  }

  movePerson(
    currentIndex: number,
    direction: 'up' | 'down',
    people: MainSegmentAdminPersonResponse[],
  ): void {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= people.length) return;

    const copy = [...people];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const ids = copy.map((p) => p.id);
    this.adminService.reorderPeople(this.year, ids).subscribe({
      next: (updated) => {
        this.vm$.next({ status: 'loaded', edition: updated });
      },
      error: (err) => {
        this.errorMessage$.next(err?.error?.message || 'Failed to reorder speakers.');
      },
    });
  }

  /* ── Organizations CRUD & Reorder ── */
  openAddOrgModal(): void {
    this.editingOrgId = null;
    this.orgForm.reset({
      name: '',
      category: MainSegmentOrganizationCategory.Sponsor,
      websiteUrl: '',
      sponsorTier: 'Platinum',
      isVisible: true,
    });
    this.isOrgModalOpen$.next(true);
  }

  openEditOrgModal(org: MainSegmentAdminOrganizationResponse): void {
    this.editingOrgId = org.id;
    this.orgForm.patchValue({
      name: org.name,
      category: org.category,
      websiteUrl: org.websiteUrl || '',
      sponsorTier: org.sponsorTier || 'Platinum',
      isVisible: org.isVisible,
    });
    this.isOrgModalOpen$.next(true);
  }

  closeOrgModal(): void {
    this.isOrgModalOpen$.next(false);
    this.editingOrgId = null;
  }

  saveOrg(): void {
    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }

    const val = this.orgForm.value;
    const request: MainSegmentOrganizationRequest = {
      name: val.name.trim(),
      category: val.category,
      websiteUrl: val.websiteUrl ? val.websiteUrl.trim() : null,
      sponsorTier:
        val.category === MainSegmentOrganizationCategory.Sponsor ? val.sponsorTier : null,
      isVisible: Boolean(val.isVisible),
    };

    this.isSaving$.next(true);
    const obs$ = this.editingOrgId
      ? this.adminService.updateOrganization(this.year, this.editingOrgId, request)
      : this.adminService.createOrganization(this.year, request);

    obs$.subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.closeOrgModal();
        this.showSuccess('Organization saved.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to save organization.');
      },
    });
  }

  deleteOrg(orgId: string): void {
    if (!confirm('Are you sure you want to delete this organization?')) return;

    this.isSaving$.next(true);
    this.adminService.deleteOrganization(this.year, orgId).subscribe({
      next: (updated) => {
        this.isSaving$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Organization deleted.');
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to delete organization.');
      },
    });
  }

  onOrgLogoSelected(orgId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.isUploadingImage$.next(true);
    this.adminService.uploadOrganizationLogo(this.year, orgId, file).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Logo uploaded successfully.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to upload logo.');
      },
    });
  }

  removeOrgLogo(orgId: string): void {
    if (!confirm('Remove organization logo?')) return;

    this.isUploadingImage$.next(true);
    this.adminService.deleteOrganizationLogo(this.year, orgId).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Logo removed.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to remove logo.');
      },
    });
  }

  moveOrg(
    currentIndex: number,
    direction: 'up' | 'down',
    orgs: MainSegmentAdminOrganizationResponse[],
  ): void {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orgs.length) return;

    const copy = [...orgs];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const ids = copy.map((o) => o.id);
    this.adminService.reorderOrganizations(this.year, ids).subscribe({
      next: (updated) => {
        this.vm$.next({ status: 'loaded', edition: updated });
      },
      error: (err) => {
        this.errorMessage$.next(err?.error?.message || 'Failed to reorder organizations.');
      },
    });
  }

  /* ── Registration Form Builder (Milestone 6) ── */
  loadSchema(year: number): void {
    this.isLoadingSchema$.next(true);
    this.schemaError$.next(null);
    this.adminService
      .getRegistrationSchema(year)
      .pipe(
        tap((schema) => {
          this.schema$.next(schema);
          this.schemaDirty = false;
          this.populateSchemaSettings(schema.settings);
          this.isLoadingSchema$.next(false);
        }),
        catchError((error) => {
          this.isLoadingSchema$.next(false);
          this.schema$.next(null);
          this.schemaError$.next(
            error?.error?.message || 'The registration schema could not be loaded.',
          );
          return of(null);
        }),
      )
      .subscribe();
  }

  populateSchemaSettings(settings: RegistrationSettings): void {
    this.schemaSettingsForm.patchValue({
      minGraduationYear: settings.minGraduationYear || 2020,
      maxGraduationYear: settings.maxGraduationYear || 2035,
      eligibilityText: settings.eligibilityText || '',
      privacyNoticeVersion: settings.privacyNoticeVersion || '2026.1',
      privacyNoticeUrl: settings.privacyNoticeUrl || '',
      submissionWorkflow: settings.submissionWorkflow || 'ReviewFirst',
    });
    this.schemaSettingsForm.markAsPristine();
  }

  saveDraftSchema(): void {
    if (this.isSavingSchema$.value) return;
    if (this.schemaSettingsForm.invalid) {
      this.schemaSettingsForm.markAllAsTouched();
      this.errorMessage$.next('Please resolve errors in registration settings before saving.');
      return;
    }

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const request = this.buildSchemaUpdateRequest(currentSchema);

    this.isSavingSchema$.next(true);
    this.errorMessage$.next(null);

    this.adminService.updateRegistrationSchema(this.year, request).subscribe({
      next: (updated) => {
        this.isSavingSchema$.next(false);
        this.schema$.next(updated);
        this.schemaDirty = false;
        this.populateSchemaSettings(updated.settings);
        this.showSuccess('Registration schema draft saved.');
      },
      error: (err) => {
        this.isSavingSchema$.next(false);
        this.errorMessage$.next(this.registrationActionError(err, 'Failed to save form draft.'));
      },
    });
  }

  publishSchema(): void {
    if (this.isSavingSchema$.value || !this.schema$.value) return;
    if (!this.schema$.value?.questions.some(question => question.isActive)) {
      this.errorMessage$.next('Add at least one active question before publishing.');
      return;
    }
    const conf = confirm(
      'Publishing this registration form schema will make it live for all future applicants. ' +
        'Existing registrations will remain linked to their previous submission versions. Continue?',
    );
    if (!conf) return;

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    this.isSavingSchema$.next(true);
    this.errorMessage$.next(null);

    this.adminService
      .publishRegistrationSchema(this.year, this.buildSchemaUpdateRequest(currentSchema))
      .subscribe({
        next: (published) => {
          this.isSavingSchema$.next(false);
          this.schema$.next(published);
          this.schemaDirty = false;
          this.populateSchemaSettings(published.settings);
          this.showSuccess(`Schema v${published.version} published live.`);
        },
        error: (err) => {
          this.isSavingSchema$.next(false);
          this.errorMessage$.next(this.registrationActionError(err, 'Failed to publish registration form.'));
        },
      });
  }

  private buildSchemaUpdateRequest(
    currentSchema: AdminRegistrationSchemaResponse,
  ): UpdateRegistrationSchemaRequest {
    const settingsVal = this.schemaSettingsForm.value;
    return {
      settings: {
        ...currentSchema.settings,
        minGraduationYear: Number(settingsVal.minGraduationYear),
        maxGraduationYear: Number(settingsVal.maxGraduationYear),
        eligibilityText: settingsVal.eligibilityText?.trim() || null,
        privacyNoticeVersion: settingsVal.privacyNoticeVersion.trim(),
        privacyNoticeUrl: settingsVal.privacyNoticeUrl?.trim() || null,
        submissionWorkflow: settingsVal.submissionWorkflow,
      },
      questions: currentSchema.questions,
    };
  }

  seedDefaultQuestions(): void {
    if (this.isSavingSchema$.value) return;
    const conf = confirm('Reset question builder to the standard 2026 default question set?');
    if (!conf) return;

    this.isSavingSchema$.next(true);
    this.adminService.seedDefaultRegistrationSchema(this.year).subscribe({
      next: (seeded) => {
        this.isSavingSchema$.next(false);
        this.schema$.next(seeded);
        this.schemaDirty = false;
        this.populateSchemaSettings(seeded.settings);
        this.showSuccess('Standard 2026 questions successfully applied.');
      },
      error: (err) => {
        this.isSavingSchema$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to seed questions.');
      },
    });
  }

  openAddQuestionModal(): void {
    if (this.isSavingSchema$.value) return;
    this.questionEditorError = null;
    this.editingQuestionId = null;
    this.questionOptionsArray.clear();
    this.questionForm.reset({
      title: '',
      key: '',
      description: '',
      type: 'ShortText',
      placeholder: '',
      maxLength: null,
      isRequired: true,
      isActive: true,
      allowOther: false,
      hasCondition: false,
      conditionalOnKey: '',
      conditionalValue: '',
    });
    this.isQuestionModalOpen$.next(true);
  }

  openEditQuestionModal(q: AdminRegistrationQuestion): void {
    if (this.isSavingSchema$.value) return;
    this.questionEditorError = null;
    this.editingQuestionId = q.id;
    this.questionOptionsArray.clear();

    const options = q.options || [];
    for (const opt of options) {
      this.questionOptionsArray.push(
        this.fb.group({
          label: [opt.label, [Validators.required]],
          value: [opt.value, [Validators.required]],
          id: [opt.id],
          isOther: [opt.isOther === true],
          isActive: [opt.isActive !== false],
        }),
      );
    }

    this.questionForm.patchValue({
      title: q.title,
      key: q.key,
      description: q.description || '',
      type: q.type,
      placeholder: q.placeholder || '',
      maxLength: q.maxLength || null,
      isRequired: q.isRequired,
      isActive: q.isActive,
      allowOther: Boolean(q.allowOther),
      hasCondition: Boolean(q.conditionalOnKey),
      conditionalOnKey: q.conditionalOnKey || '',
      conditionalValue:
        q.conditionalValue !== undefined && q.conditionalValue !== null
          ? String(q.conditionalValue)
          : '',
    });

    this.isQuestionModalOpen$.next(true);
  }

  closeQuestionModal(): void {
    this.isQuestionModalOpen$.next(false);
    this.editingQuestionId = null;
  }

  addQuestionOption(): void {
    this.questionOptionsArray.push(
      this.fb.group({
        label: ['', [Validators.required]],
        value: ['', [Validators.required]],
        id: [''], isOther: [false], isActive: [true],
      }),
    );
  }

  removeQuestionOption(index: number): void {
    this.questionOptionsArray.removeAt(index);
  }

  moveQuestionOption(currentIndex: number, direction: 'up' | 'down'): void {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= this.questionOptionsArray.length) return;

    const currentCtrl = this.questionOptionsArray.at(currentIndex);
    this.questionOptionsArray.removeAt(currentIndex);
    this.questionOptionsArray.insert(targetIndex, currentCtrl);
  }

  saveQuestion(): void {
    if (this.isSavingSchema$.value) return;
    this.questionEditorError = null;
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const val = this.questionForm.value;
    const isChoice = val.type === 'SingleChoice' || val.type === 'MultipleChoice';
    const key = val.key.trim().toLowerCase();
    const original = currentSchema.questions.find(question => question.id === this.editingQuestionId);
    if (!val.title.trim() || currentSchema.questions.some(question => question.key === key && question.id !== this.editingQuestionId)) {
      this.questionEditorError = 'Enter a question title and a unique key.';
      return;
    }

    const options: RegistrationQuestionOption[] = isChoice
      ? val.options.map((opt: any, idx: number) => ({
          id: opt.id || `opt-${idx + 1}`,
          label: opt.label.trim(),
          value: opt.value.trim(),
          displayOrder: idx,
          isActive: opt.isActive !== false,
          isOther: Boolean(val.allowOther) && (opt.isOther === true || opt.value.trim().toLowerCase() === 'other'),
        }))
      : [];
    if (isChoice && val.allowOther && !options.some(option => option.isOther)) {
      options.push({ id: 'new-other', label: 'Other', value: 'other', isOther: true, isActive: true, displayOrder: options.length });
    }
    if (isChoice && (!options.some(option => option.isActive !== false) || options.some(option => !option.label || !option.value || /\s/.test(option.value)) || new Set(options.map(option => option.value.toLowerCase())).size !== options.length)) {
      this.questionEditorError = 'Add at least one active choice. Choice values must be unique and contain no spaces.';
      return;
    }
    if (val.maxLength != null && val.maxLength !== '' && (Number(val.maxLength) < 0 || Number(val.maxLength) > 10000)) {
      this.questionEditorError = 'Maximum length must be between 0 and 10,000.';
      return;
    }

    let conditionalValue: string | boolean | null = null;
    if (val.hasCondition && val.conditionalOnKey) {
      const parent = currentSchema.questions.find(question => question.key === val.conditionalOnKey);
      if (parent?.type === 'YesNo' && val.conditionalValue === 'true') {
        conditionalValue = true;
      } else if (parent?.type === 'YesNo' && val.conditionalValue === 'false') {
        conditionalValue = false;
      } else {
        conditionalValue = val.conditionalValue ? val.conditionalValue.trim() : null;
      }
    }
    if (val.hasCondition) {
      const parent = currentSchema.questions.find(question => question.key === val.conditionalOnKey);
      const validValue = parent?.type === 'YesNo'
        ? typeof conditionalValue === 'boolean'
        : parent?.options?.some(option => option.isActive !== false && option.value === conditionalValue);
      if (!parent || !parent.isActive || parent.conditionalOnKey || parent.id === this.editingQuestionId || !validValue) {
        this.questionEditorError = 'Choose an active, unconditional parent question and one of its valid answers.';
        return;
      }
    }
    const dependents = currentSchema.questions.filter(question => question.isActive && question.conditionalOnKey === original?.key);
    if (original && dependents.length && (!val.isActive || val.type !== original.type || key !== original.key || dependents.some(dependent => isChoice && !options.some(option => option.isActive !== false && option.value === dependent.conditionalValue)))) {
      this.questionEditorError = 'Update the questions that depend on this answer before changing its key, type, availability, or choices.';
      return;
    }

    const question: AdminRegistrationQuestion = {
      id: this.editingQuestionId || `q-${Date.now()}`,
      key: val.key.trim().toLowerCase(),
      title: val.title.trim(),
      description: val.description ? val.description.trim() : null,
      type: val.type as RegistrationQuestionType,
      placeholder: val.placeholder ? val.placeholder.trim() : null,
      maxLength: ['ShortText', 'LongText'].includes(val.type) && val.maxLength != null && val.maxLength !== '' ? Number(val.maxLength) : null,
      minLength: original && original.type === val.type ? original.minLength : null,
      minSelections: original && original.type === val.type ? original.minSelections : null,
      maxSelections: original && original.type === val.type ? original.maxSelections : null,
      isRequired: Boolean(val.isRequired),
      isActive: Boolean(val.isActive),
      displayOrder: this.editingQuestionId
        ? original?.displayOrder ?? 0
        : currentSchema.questions.length,
      options: options.length > 0 ? options : null,
      allowOther: Boolean(val.allowOther),
      conditionalOnKey: val.hasCondition && val.conditionalOnKey ? val.conditionalOnKey : null,
      conditionalValue,
    };

    let nextQuestions = [...currentSchema.questions];
    if (this.editingQuestionId) {
      nextQuestions = nextQuestions.map((q) => (q.id === this.editingQuestionId ? question : q));
    } else {
      nextQuestions.push(question);
    }

    const updatedSchema: AdminRegistrationSchemaResponse = {
      ...currentSchema,
      questions: nextQuestions,
    };

    this.schema$.next(updatedSchema);
    this.schemaDirty = true;
    this.closeQuestionModal();
    this.showSuccess('Question updated. Remember to save or publish your schema draft.');
  }

  deleteQuestion(id: string): void {
    if (this.isSavingSchema$.value) return;
    if (!confirm('Are you sure you want to remove this question from the registration form?'))
      return;

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const questionToDelete = currentSchema.questions.find((q) => q.id === id);
    if (!questionToDelete) return;

    // Check if any other question conditionally depends on this question
    const dependents = currentSchema.questions.filter(
      (q) => q.conditionalOnKey === questionToDelete.key,
    );
    if (dependents.length > 0) {
      alert(
        `Cannot delete "${questionToDelete.title}" because the question "${dependents[0].title}" depends on its answer.`,
      );
      return;
    }

    const nextQuestions = currentSchema.questions
      .filter((q) => q.id !== id)
      .map((q, idx) => ({ ...q, displayOrder: idx }));

    this.schema$.next({
      ...currentSchema,
      questions: nextQuestions,
    });
    this.showSuccess('Question removed.');
    this.schemaDirty = true;
  }

  moveQuestion(currentIndex: number, direction: 'up' | 'down'): void {
    if (this.isSavingSchema$.value) return;
    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentSchema.questions.length) return;

    const copy = [...currentSchema.questions];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((q, idx) => ({ ...q, displayOrder: idx }));
    this.schemaDirty = true;
    this.schema$.next({
      ...currentSchema,
      questions: reordered,
    });
  }

  getPreviousConditionCandidates(currentQuestionId?: string | null): AdminRegistrationQuestion[] {
    const currentSchema = this.schema$.value;
    if (!currentSchema) return [];

    return currentSchema.questions.filter(
      (q) => ['YesNo', 'SingleChoice', 'MultipleChoice'].includes(q.type) && q.isActive && !q.conditionalOnKey && q.id !== currentQuestionId,
    );
  }

  getConditionQuestionOptions(targetKey?: string): RegistrationQuestionOption[] {
    if (!targetKey) return [];
    const currentSchema = this.schema$.value;
    if (!currentSchema) return [];

    const target = currentSchema.questions.find((q) => q.key === targetKey);
    return target?.options?.filter(option => option.isActive !== false) || [];
  }

  openSchemaPreview(): void {
    const schema = this.schema$.value;
    if (!schema || this.activeTab !== 'form-builder') return;
    this.schemaPreview = {
      id: schema.id, schemaId: schema.schemaId, version: schema.version,
      consentNoticeVersion: schema.settings.privacyNoticeVersion,
      questions: [...schema.questions].filter(question => question.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(question => ({ ...question, options: question.options?.filter(option => option.isActive !== false) })),
    };
    this.isSchemaPreviewOpen$.next(true);
  }

  closeSchemaPreview(): void {
    this.isSchemaPreviewOpen$.next(false);
    this.schemaPreview = null;
  }

  /* ── Registrations Review, Detail & Export (Milestone 7) ── */
  loadRegistrations(): void {
    const requestSequence = ++this.registrationLoadSequence;
    this.isLoadingRegistrations$.next(true);
    this.registrationLoadState$.next('loading');
    this.registrationErrorMessage$.next(null);
    const params: RegistrationListFilterParams = {
      search: this.regSearch,
      status: this.regStatusFilter,
      universityId: this.regUniversityIdFilter || undefined,
      facultyId: this.regFacultyIdFilter || undefined,
      graduationYear: this.regGradYearFilter,
      submittedFrom: this.toRegistrationDateBoundary(this.regSubmittedFrom, false),
      submittedTo: this.toRegistrationDateBoundary(this.regSubmittedTo, true),
      page: this.regPage,
      pageSize: this.regPageSize,
    };

    this.adminService.getRegistrations(this.year, params).subscribe({
      next: (response) => {
        if (requestSequence !== this.registrationLoadSequence) return;
        this.registrations$.next(response);
        this.isLoadingRegistrations$.next(false);
        this.registrationLoadState$.next(response.items.length === 0 ? 'empty' : 'loaded');
      },
      error: (error) => {
        if (requestSequence !== this.registrationLoadSequence) return;
        this.isLoadingRegistrations$.next(false);
        this.registrations$.next(null);
        const forbidden = error?.status === 401 || error?.status === 403;
        this.registrationLoadState$.next(forbidden ? 'forbidden' : 'error');
        this.registrationErrorMessage$.next(
          forbidden
            ? 'Your session is not authorized to review registrations.'
            : this.registrationActionError(error, 'Failed to load attendee registrations.'),
        );
      },
    });
  }

  loadRegistrationUniversityFilters(): void {
    this.academicDirectoryService.getUniversities(undefined, 1, 100).pipe(
      expand(response => response.hasNextPage
        ? this.academicDirectoryService.getUniversities(undefined, response.page + 1, 100)
        : EMPTY),
      reduce((items, response) => [...items, ...(response.items ?? [])], [] as AcademicUniversityItem[]),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (items) => this.registrationUniversities$.next(items),
      error: () => this.registrationUniversities$.next([]),
    });
  }

  setRegistrationStatusFilter(status: RegistrationStatus | 'All'): void {
    this.regStatusFilter = status;
    this.regPage = 1;
    this.loadRegistrations();
  }

  onRegistrationSearch(query: string): void {
    this.regSearch = query.trim();
    this.regSearchInput = this.regSearch;
    this.regPage = 1;
    this.loadRegistrations();
  }

  setRegistrationUniversityFilter(universityId: string): void {
    this.regUniversityIdFilter = universityId;
    this.regFacultyIdFilter = '';
    this.registrationFaculties$.next([]);
    if (universityId) {
      this.academicDirectoryService.getFaculties(universityId, undefined, 1, 100).subscribe({
        next: (response) => {
          if (this.regUniversityIdFilter === universityId) this.registrationFaculties$.next(response.items ?? []);
        },
        error: () => {
          if (this.regUniversityIdFilter === universityId) this.registrationFaculties$.next([]);
        },
      });
    }
    this.regPage = 1;
    this.loadRegistrations();
  }

  setRegistrationFacultyFilter(facultyId: string): void {
    this.regFacultyIdFilter = facultyId;
    this.regPage = 1;
    this.loadRegistrations();
  }

  setRegistrationGradYearFilter(year: number | null): void {
    this.regGradYearFilter = year;
    this.regPage = 1;
    this.loadRegistrations();
  }

  setRegistrationDateFilter(boundary: 'from' | 'to', value: string): void {
    if (boundary === 'from') {
      this.regSubmittedFrom = value;
    } else {
      this.regSubmittedTo = value;
    }
    this.regPage = 1;
    this.loadRegistrations();
  }

  clearRegistrationFilters(): void {
    this.regSearch = '';
    this.regSearchInput = '';
    this.regStatusFilter = 'All';
    this.regUniversityIdFilter = '';
    this.regFacultyIdFilter = '';
    this.regGradYearFilter = null;
    this.regSubmittedFrom = '';
    this.regSubmittedTo = '';
    this.registrationFaculties$.next([]);
    this.regPage = 1;
    this.loadRegistrations();
  }

  goToRegistrationPage(page: number): void {
    const totalPages = this.registrations$.value?.totalPages || 1;
    if (page < 1 || page > totalPages) return;
    this.regPage = page;
    this.loadRegistrations();
  }

  openRegistrationDetail(regId: string): void {
    const requestSequence = ++this.registrationDetailSequence;
    this.selectedRegistrationId = regId;
    this.selectedRegistration$.next(null);
    this.registrationDetailError$.next(null);
    this.isLoadingDetail$.next(true);
    this.isDetailModalOpen$.next(true);
    this.statusUpdateForm.reset({ status: 'Submitted', note: '' });

    this.adminService.getRegistrationDetail(this.year, regId).subscribe({
      next: (detail) => {
        if (requestSequence !== this.registrationDetailSequence) return;
        this.selectedRegistration$.next(detail);
        this.statusUpdateForm.patchValue({ status: detail.status });
        this.isLoadingDetail$.next(false);
      },
      error: (err) => {
        if (requestSequence !== this.registrationDetailSequence) return;
        this.isLoadingDetail$.next(false);
        this.registrationDetailError$.next(
          this.registrationActionError(err, 'Failed to load registration details.'),
        );
      },
    });
  }

  closeRegistrationDetail(): void {
    this.registrationDetailSequence++;
    this.isDetailModalOpen$.next(false);
    this.selectedRegistration$.next(null);
    this.selectedRegistrationId = null;
    this.registrationDetailError$.next(null);
    this.closeDocumentViewer();
  }

  submitStatusUpdate(): void {
    const detail = this.selectedRegistration$.value;
    if (!detail || this.statusUpdateForm.invalid || this.isUpdatingStatus$.value) return;

    const val = this.statusUpdateForm.value;
    const nextStatus = val.status as RegistrationStatus;
    if (nextStatus === detail.status) {
      this.registrationErrorMessage$.next('Choose a different status before saving.');
      return;
    }
    if (
      ['Accepted', 'Rejected', 'Cancelled'].includes(nextStatus) &&
      !confirm(`Change ${detail.referenceNumber} from ${detail.status} to ${nextStatus}?`)
    ) {
      return;
    }
    const req: UpdateRegistrationStatusRequest = {
      status: nextStatus,
      note: val.note ? val.note.trim() : null,
    };

    const detailSequence = this.registrationDetailSequence;
    this.isUpdatingStatus$.next(true);
    this.registrationErrorMessage$.next(null);
    this.adminService
      .updateRegistrationStatus(this.year, detail.id, req)
      .pipe(switchMap(() => this.adminService.getRegistrationDetail(this.year, detail.id)))
      .subscribe({
        next: (refreshedDetail) => {
          this.isUpdatingStatus$.next(false);
          if (detailSequence === this.registrationDetailSequence) {
            this.selectedRegistration$.next(refreshedDetail);
            this.statusUpdateForm.reset({ status: refreshedDetail.status, note: '' });
          }
          this.showSuccess(`Applicant status updated to ${refreshedDetail.status}.`);
          this.loadRegistrations();
        },
        error: (err) => {
          this.isUpdatingStatus$.next(false);
          if (detailSequence !== this.registrationDetailSequence) return;
          this.registrationErrorMessage$.next(
            this.registrationActionError(err, 'Failed to update registration status.'),
          );
        },
      });
  }

  /* ── Private Document Handling ── */
  openPrivateDocument(regId: string, docType: PrivateDocumentType, title: string): void {
    const requestSequence = ++this.documentRequestSequence;
    this.revokeDocumentUrl();
    this.documentViewer$.next({
      isOpen: true,
      title,
      objectUrl: null,
      isLoading: true,
      error: null,
    });

    this.adminService.getPrivateDocument(this.year, regId, docType).subscribe({
      next: (blob) => {
        if (requestSequence !== this.documentRequestSequence) return;
        if (!blob.type.toLowerCase().startsWith('image/')) {
          this.documentViewer$.next({
            isOpen: true,
            title,
            objectUrl: null,
            isLoading: false,
            error: 'This private document cannot be previewed safely. Download it instead.',
          });
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        this.documentViewer$.next({
          isOpen: true,
          title,
          objectUrl,
          isLoading: false,
          error: null,
        });
      },
      error: (err) => {
        if (requestSequence !== this.documentRequestSequence) return;
        this.documentViewer$.next({
          isOpen: true,
          title,
          objectUrl: null,
          isLoading: false,
          error: this.privateDocumentError(err),
        });
      },
    });
  }

  downloadPrivateDocument(
    regId: string,
    docType: PrivateDocumentType,
    defaultFileName: string,
  ): void {
    if (this.downloadingDocument$.value) return;
    this.downloadingDocument$.next(docType);
    this.registrationErrorMessage$.next(null);
    this.adminService.getPrivateDocument(this.year, regId, docType).subscribe({
      next: (blob) => {
        this.downloadingDocument$.next(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.safeDownloadFileName(defaultFileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        this.downloadingDocument$.next(null);
        this.registrationErrorMessage$.next(this.privateDocumentError(err));
      },
    });
  }

  closeDocumentViewer(): void {
    this.documentRequestSequence++;
    this.revokeDocumentUrl();
    this.documentViewer$.next({
      isOpen: false,
      title: '',
      objectUrl: null,
      isLoading: false,
      error: null,
    });
  }

  private revokeDocumentUrl(): void {
    const current = this.documentViewer$.value.objectUrl;
    if (current) {
      URL.revokeObjectURL(current);
    }
  }

  /* ── CSV Export ── */
  exportRegistrationsCsv(): void {
    if (this.isExporting$.value) return;
    if ((this.registrations$.value?.totalCount ?? 0) === 0) {
      this.registrationErrorMessage$.next(
        'There are no registrations to export for the active filters.',
      );
      return;
    }
    this.isExporting$.next(true);
    this.registrationErrorMessage$.next(null);
    const params: Partial<RegistrationListFilterParams> = {
      search: this.regSearch,
      status: this.regStatusFilter,
      universityId: this.regUniversityIdFilter || undefined,
      facultyId: this.regFacultyIdFilter || undefined,
      graduationYear: this.regGradYearFilter,
      submittedFrom: this.toRegistrationDateBoundary(this.regSubmittedFrom, false),
      submittedTo: this.toRegistrationDateBoundary(this.regSubmittedTo, true),
    };

    this.adminService.exportRegistrationsCsv(this.year, params).subscribe({
      next: (blob) => {
        this.isExporting$.next(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `main-segment-${this.year}-registrations.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showSuccess('Registrations CSV exported successfully.');
      },
      error: (err) => {
        this.isExporting$.next(false);
        this.registrationErrorMessage$.next(
          this.registrationActionError(err, 'Failed to export registrations CSV.'),
        );
      },
    });
  }

  getAllowedRegistrationStatuses(current: RegistrationStatus): RegistrationStatus[] {
    const transitions: Record<RegistrationStatus, RegistrationStatus[]> = {
      Submitted: ['UnderReview', 'Accepted', 'Waitlisted', 'Rejected', 'Cancelled'],
      UnderReview: ['Submitted', 'Accepted', 'Waitlisted', 'Rejected', 'Cancelled'],
      Accepted: ['Cancelled'],
      Waitlisted: ['UnderReview', 'Accepted', 'Rejected', 'Cancelled'],
      Rejected: ['UnderReview', 'Cancelled'],
      Cancelled: ['UnderReview'],
    };
    return [current, ...transitions[current]];
  }

  registrationStatusLabel(status: RegistrationStatus | null): string {
    if (!status) return 'Created';
    return status.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  registrationDocumentFileName(
    detail: AdminRegistrationDetailResponse,
    documentType: AdminRegistrationDocumentDetail['documentType'],
    fallback: string,
  ): string {
    return (
      detail.documents.find((item) => item.documentType === documentType)?.displayName || fallback
    );
  }

  private toRegistrationDateBoundary(value: string, endOfDay: boolean): string | null {
    if (!value) return null;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    const parsed = new Date(`${value}${suffix}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  private privateDocumentError(error: any): string {
    if (error?.status === 401)
      return 'Your session expired. Sign in again before requesting this document.';
    if (error?.status === 403) return 'You are not authorized to access this private document.';
    if (error?.status === 404) return 'This document is no longer available.';
    return 'Failed to retrieve the requested private document.';
  }

  private registrationActionError(error: any, fallback: string): string {
    if (error?.status === 401) return 'Your session expired. Sign in again to continue.';
    if (error?.status === 403) return 'You are not authorized to perform this registration action.';
    if (error?.status === 404) return 'The requested registration was not found.';
    return error?.error?.message || error?.error?.Message || fallback;
  }

  private safeDownloadFileName(value: string): string {
    const sanitized = value.trim().replace(/[\\/:*?"<>|]/g, '_');
    return sanitized || 'main-segment-document';
  }

  /* ── Filter Helpers ── */
  getFilteredProgramItems(
    items: MainSegmentAdminProgramItemResponse[],
  ): MainSegmentAdminProgramItemResponse[] {
    if (!items) return [];
    if (this.programFilter === 'All' || this.programFilter === 'Speakers') return items;
    return items.filter((i) => i.category === this.programFilter);
  }

  getFilteredOrganizations(
    orgs: MainSegmentAdminOrganizationResponse[],
  ): MainSegmentAdminOrganizationResponse[] {
    if (!orgs) return [];
    if (this.orgFilter === 'All') return orgs;
    return orgs.filter((o) => o.category === this.orgFilter);
  }

  getAssignedPeopleNames(personIds: string[], allPeople: MainSegmentAdminPersonResponse[]): string {
    if (!personIds || !allPeople) return 'None';
    const names = allPeople.filter((p) => personIds.includes(p.id)).map((p) => p.name);
    return names.length > 0 ? names.join(', ') : 'None';
  }

  getPersonAssignedItemTitles(
    itemIds: string[],
    allItems: MainSegmentAdminProgramItemResponse[],
  ): string {
    if (!itemIds || !allItems) return 'None';
    const titles = allItems.filter((i) => itemIds.includes(i.id)).map((i) => i.title);
    return titles.length > 0 ? titles.join(', ') : 'None';
  }

  togglePersonAssignmentInItem(personId: string): void {
    const current = (this.programItemForm.get('personIds')?.value || []) as string[];
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    this.programItemForm.patchValue({ personIds: next });
  }

  toggleItemAssignmentInPerson(itemId: string): void {
    const current = (this.personForm.get('programItemIds')?.value || []) as string[];
    const next = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    this.personForm.patchValue({ programItemIds: next });
  }

  getSectionTitle(key: MainSegmentSectionKey): string {
    return getSectionDisplayTitle(key);
  }

  getSectionEyebrow(key: MainSegmentSectionKey): string {
    return getSectionEyebrow(key);
  }

  programCategoryLabel(category: MainSegmentProgramCategory): string {
    const labels: Record<MainSegmentProgramCategory, string> = {
      [MainSegmentProgramCategory.PanelDiscussion]: 'Panel discussion',
      [MainSegmentProgramCategory.Talk]: 'Talk',
      [MainSegmentProgramCategory.Workshop]: 'Workshop',
      [MainSegmentProgramCategory.MentorshipCircle]: 'Mentorship circle',
    };
    return labels[category] ?? category;
  }

  organizationCategoryLabel(category: MainSegmentOrganizationCategory): string {
    const labels: Record<MainSegmentOrganizationCategory, string> = {
      [MainSegmentOrganizationCategory.CareerFair]: 'Career fair',
      [MainSegmentOrganizationCategory.CvReviewAndMockInterview]: 'CV review & interviews',
      [MainSegmentOrganizationCategory.Sponsor]: 'Sponsor',
      [MainSegmentOrganizationCategory.Partner]: 'Partner',
    };
    return labels[category] ?? category;
  }

  registrationQuestionTypeLabel(type: RegistrationQuestionType): string {
    const labels: Record<RegistrationQuestionType, string> = {
      ShortText: 'Short text',
      LongText: 'Long text',
      SingleChoice: 'Single choice',
      MultipleChoice: 'Multiple choice',
      YesNo: 'Yes / No',
      ConditionalTeam: 'Team selection',
    };
    return labels[type] ?? type;
  }

  getPersonInitials(name: string): string {
    return getPersonInitials(name);
  }

  getOrgInitials(name: string): string {
    return getOrgInitials(name);
  }

  private showSuccess(msg: string): void {
    this.successMessage$.next(msg);
    setTimeout(() => {
      if (this.successMessage$.value === msg) {
        this.successMessage$.next(null);
      }
    }, 4000);
  }
}
