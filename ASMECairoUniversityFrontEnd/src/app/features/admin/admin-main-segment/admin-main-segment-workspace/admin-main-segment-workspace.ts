import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AdminNavComponent } from '../../../../shared/components/admin-nav/admin-nav';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
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
  AdminRegistrationListItem,
  AdminRegistrationListResponse,
  AdminRegistrationQuestion,
  AdminRegistrationSchemaResponse,
  DEFAULT_ADMIN_SCHEMA,
  PrivateDocumentType,
  RegistrationListFilterParams,
  RegistrationQuestionOption,
  RegistrationQuestionType,
  RegistrationSettings,
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe, AdminNavComponent],
  templateUrl: './admin-main-segment-workspace.html',
  styleUrl: './admin-main-segment-workspace.css',
})
export class AdminMainSegmentWorkspaceComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminMainSegmentService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  activeTab: WorkspaceTab = 'overview';
  year = 0;

  readonly vm$ = new BehaviorSubject<WorkspaceVM>({ status: 'loading' });
  readonly isSaving$ = new BehaviorSubject<boolean>(false);
  readonly isUploadingImage$ = new BehaviorSubject<boolean>(false);
  readonly isPreviewModalOpen$ = new BehaviorSubject<boolean>(false);
  readonly previewData$ = new BehaviorSubject<MainSegmentAdminResponse | null>(null);

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
  readonly isSavingSchema$ = new BehaviorSubject<boolean>(false);
  readonly isSchemaPreviewOpen$ = new BehaviorSubject<boolean>(false);

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
    key: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
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
  readonly isExporting$ = new BehaviorSubject<boolean>(false);

  regSearch = '';
  regStatusFilter: RegistrationStatus | 'All' = 'All';
  regGradYearFilter: number | null = null;
  regPage = 1;
  regPageSize = 10;

  readonly isDetailModalOpen$ = new BehaviorSubject<boolean>(false);
  readonly selectedRegistration$ = new BehaviorSubject<AdminRegistrationDetailResponse | null>(null);
  readonly isLoadingDetail$ = new BehaviorSubject<boolean>(false);
  readonly isUpdatingStatus$ = new BehaviorSubject<boolean>(false);

  readonly statusUpdateForm: FormGroup = this.fb.group({
    status: ['Received', [Validators.required]],
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
        })
      )
      .subscribe();

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
    this.revokeDocumentUrl();
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): boolean {
    if (this.form.dirty || this.schemaSettingsForm.dirty) {
      return confirm(
        'You have unsaved changes in this edition workspace. Are you sure you want to navigate away?'
      );
    }
    return true;
  }

  setTab(tab: WorkspaceTab): void {
    this.activeTab = tab;
    if (tab === 'form-builder' && !this.schema$.value) {
      this.loadSchema(this.year);
    } else if (tab === 'registrations' && !this.registrations$.value) {
      this.loadRegistrations();
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
      })
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
        })
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
          err?.error?.message || 'Failed to save edition changes. Please verify fields.'
        );
      },
    });
  }

  onHeroImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.isUploadingImage$.next(true);
    this.errorMessage$.next(null);

    this.adminService.uploadHeroImage(this.year, file).subscribe({
      next: (updated) => {
        this.isUploadingImage$.next(false);
        this.vm$.next({ status: 'loaded', edition: updated });
        this.showSuccess('Hero visual uploaded successfully.');
      },
      error: (err) => {
        this.isUploadingImage$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to upload hero image.');
      },
    });
  }

  removeHeroImage(): void {
    if (!confirm('Are you sure you want to remove the hero visual?')) return;

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
        this.errorMessage$.next(err?.error?.message || 'Failed to remove hero image.');
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
          `Registration is now ${updated.isRegistrationAvailable ? 'OPEN' : 'CLOSED'}.`
        );
      },
      error: (err) => {
        this.isSaving$.next(false);
        this.errorMessage$.next(
          err?.error?.message || 'Failed to update registration availability.'
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

  moveProgramItem(currentIndex: number, direction: 'up' | 'down', items: MainSegmentAdminProgramItemResponse[]): void {
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

  movePerson(currentIndex: number, direction: 'up' | 'down', people: MainSegmentAdminPersonResponse[]): void {
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
      sponsorTier: val.category === MainSegmentOrganizationCategory.Sponsor ? val.sponsorTier : null,
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

  moveOrg(currentIndex: number, direction: 'up' | 'down', orgs: MainSegmentAdminOrganizationResponse[]): void {
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
    this.adminService
      .getRegistrationSchema(year)
      .pipe(
        tap((schema) => {
          this.schema$.next(schema);
          this.populateSchemaSettings(schema.settings);
          this.isLoadingSchema$.next(false);
        }),
        catchError(() => {
          this.isLoadingSchema$.next(false);
          return of(null);
        })
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
    if (this.schemaSettingsForm.invalid) {
      this.schemaSettingsForm.markAllAsTouched();
      this.errorMessage$.next('Please resolve errors in registration settings before saving.');
      return;
    }

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const settingsVal = this.schemaSettingsForm.value;
    const request: UpdateRegistrationSchemaRequest = {
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

    this.isSavingSchema$.next(true);
    this.errorMessage$.next(null);

    this.adminService.updateRegistrationSchema(this.year, request).subscribe({
      next: (updated) => {
        this.isSavingSchema$.next(false);
        this.schema$.next(updated);
        this.populateSchemaSettings(updated.settings);
        this.showSuccess('Registration schema draft saved.');
      },
      error: (err) => {
        this.isSavingSchema$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to save schema draft.');
      },
    });
  }

  publishSchema(): void {
    const conf = confirm(
      'Publishing this registration form schema will make it live for all future applicants. ' +
        'Existing registrations will remain linked to their previous submission versions. Continue?'
    );
    if (!conf) return;

    this.isSavingSchema$.next(true);
    this.errorMessage$.next(null);

    this.adminService.publishRegistrationSchema(this.year).subscribe({
      next: (published) => {
        this.isSavingSchema$.next(false);
        this.schema$.next(published);
        this.populateSchemaSettings(published.settings);
        this.showSuccess(`Schema v${published.version} published live.`);
      },
      error: (err) => {
        this.isSavingSchema$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to publish registration schema.');
      },
    });
  }

  seedDefaultQuestions(): void {
    const conf = confirm('Reset question builder to the standard 2026 default question set?');
    if (!conf) return;

    this.isSavingSchema$.next(true);
    this.adminService.seedDefaultRegistrationSchema(this.year).subscribe({
      next: (seeded) => {
        this.isSavingSchema$.next(false);
        this.schema$.next(seeded);
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
    this.editingQuestionId = q.id;
    this.questionOptionsArray.clear();

    const options = q.options || [];
    for (const opt of options) {
      this.questionOptionsArray.push(
        this.fb.group({
          label: [opt.label, [Validators.required]],
          value: [opt.value, [Validators.required]],
        })
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
      conditionalValue: q.conditionalValue !== undefined && q.conditionalValue !== null ? String(q.conditionalValue) : '',
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
      })
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
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const val = this.questionForm.value;
    const isChoice = val.type === 'SingleChoice' || val.type === 'MultipleChoice';

    const options: RegistrationQuestionOption[] = isChoice
      ? val.options.map((opt: any, idx: number) => ({
          id: `opt-${idx + 1}`,
          label: opt.label.trim(),
          value: opt.value.trim(),
        }))
      : [];

    let conditionalValue: string | boolean | null = null;
    if (val.hasCondition && val.conditionalOnKey) {
      if (val.conditionalValue === 'true') {
        conditionalValue = true;
      } else if (val.conditionalValue === 'false') {
        conditionalValue = false;
      } else {
        conditionalValue = val.conditionalValue ? val.conditionalValue.trim() : null;
      }
    }

    const question: AdminRegistrationQuestion = {
      id: this.editingQuestionId || `q-${Date.now()}`,
      key: val.key.trim().toLowerCase(),
      title: val.title.trim(),
      description: val.description ? val.description.trim() : null,
      type: val.type as RegistrationQuestionType,
      placeholder: val.placeholder ? val.placeholder.trim() : null,
      maxLength: val.maxLength ? Number(val.maxLength) : null,
      isRequired: Boolean(val.isRequired),
      isActive: Boolean(val.isActive),
      displayOrder: this.editingQuestionId
        ? currentSchema.questions.find((q) => q.id === this.editingQuestionId)?.displayOrder || 1
        : currentSchema.questions.length + 1,
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
    this.closeQuestionModal();
    this.showSuccess('Question updated. Remember to save or publish your schema draft.');
  }

  deleteQuestion(id: string): void {
    if (!confirm('Are you sure you want to remove this question from the registration form?')) return;

    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const questionToDelete = currentSchema.questions.find((q) => q.id === id);
    if (!questionToDelete) return;

    // Check if any other question conditionally depends on this question
    const dependents = currentSchema.questions.filter((q) => q.conditionalOnKey === questionToDelete.key);
    if (dependents.length > 0) {
      alert(
        `Cannot delete "${questionToDelete.title}" because the question "${dependents[0].title}" depends on its answer.`
      );
      return;
    }

    const nextQuestions = currentSchema.questions
      .filter((q) => q.id !== id)
      .map((q, idx) => ({ ...q, displayOrder: idx + 1 }));

    this.schema$.next({
      ...currentSchema,
      questions: nextQuestions,
    });
    this.showSuccess('Question removed.');
  }

  moveQuestion(currentIndex: number, direction: 'up' | 'down'): void {
    const currentSchema = this.schema$.value;
    if (!currentSchema) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentSchema.questions.length) return;

    const copy = [...currentSchema.questions];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const reordered = copy.map((q, idx) => ({ ...q, displayOrder: idx + 1 }));
    this.schema$.next({
      ...currentSchema,
      questions: reordered,
    });
  }

  getPreviousConditionCandidates(currentQuestionId?: string | null): AdminRegistrationQuestion[] {
    const currentSchema = this.schema$.value;
    if (!currentSchema) return [];

    return currentSchema.questions.filter(
      (q) => (q.type === 'YesNo' || q.type === 'SingleChoice') && q.id !== currentQuestionId
    );
  }

  getConditionQuestionOptions(targetKey?: string): RegistrationQuestionOption[] {
    if (!targetKey) return [];
    const currentSchema = this.schema$.value;
    if (!currentSchema) return [];

    const target = currentSchema.questions.find((q) => q.key === targetKey);
    return target?.options || [];
  }

  openSchemaPreview(): void {
    this.isSchemaPreviewOpen$.next(true);
  }

  closeSchemaPreview(): void {
    this.isSchemaPreviewOpen$.next(false);
  }

  /* ── Registrations Review, Detail & Export (Milestone 7) ── */
  loadRegistrations(): void {
    this.isLoadingRegistrations$.next(true);
    const params: RegistrationListFilterParams = {
      search: this.regSearch,
      status: this.regStatusFilter,
      graduationYear: this.regGradYearFilter,
      page: this.regPage,
      pageSize: this.regPageSize,
    };

    this.adminService
      .getRegistrations(this.year, params)
      .pipe(
        tap((res) => {
          this.registrations$.next(res);
          this.isLoadingRegistrations$.next(false);
        }),
        catchError((err) => {
          this.isLoadingRegistrations$.next(false);
          this.errorMessage$.next(err?.error?.message || 'Failed to load attendee registrations.');
          return of(null);
        })
      )
      .subscribe();
  }

  setRegistrationStatusFilter(status: RegistrationStatus | 'All'): void {
    this.regStatusFilter = status;
    this.regPage = 1;
    this.loadRegistrations();
  }

  onRegistrationSearch(query: string): void {
    this.regSearch = query;
    this.regPage = 1;
    this.loadRegistrations();
  }

  setRegistrationGradYearFilter(year: number | null): void {
    this.regGradYearFilter = year;
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
    this.isLoadingDetail$.next(true);
    this.isDetailModalOpen$.next(true);
    this.statusUpdateForm.reset({ status: 'Received', note: '' });

    this.adminService.getRegistrationDetail(this.year, regId).subscribe({
      next: (detail) => {
        this.selectedRegistration$.next(detail);
        this.statusUpdateForm.patchValue({ status: detail.status });
        this.isLoadingDetail$.next(false);
      },
      error: (err) => {
        this.isLoadingDetail$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to load registration details.');
      },
    });
  }

  closeRegistrationDetail(): void {
    this.isDetailModalOpen$.next(false);
    this.selectedRegistration$.next(null);
    this.closeDocumentViewer();
  }

  submitStatusUpdate(): void {
    const detail = this.selectedRegistration$.value;
    if (!detail || this.statusUpdateForm.invalid) return;

    const val = this.statusUpdateForm.value;
    const req: UpdateRegistrationStatusRequest = {
      status: val.status,
      note: val.note ? val.note.trim() : null,
    };

    this.isUpdatingStatus$.next(true);
    this.adminService.updateRegistrationStatus(this.year, detail.id, req).subscribe({
      next: (updated) => {
        this.isUpdatingStatus$.next(false);
        this.selectedRegistration$.next(updated);
        this.showSuccess(`Applicant status updated to ${updated.status}.`);
        this.loadRegistrations(); // refresh counters and table
      },
      error: (err) => {
        this.isUpdatingStatus$.next(false);
        this.errorMessage$.next(err?.error?.message || 'Failed to update registration status.');
      },
    });
  }

  /* ── Private Document Handling ── */
  openPrivateDocument(regId: string, docType: PrivateDocumentType, title: string): void {
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
        this.documentViewer$.next({
          isOpen: true,
          title,
          objectUrl: null,
          isLoading: false,
          error: err?.status === 403 ? 'Unauthorized: You do not have permission to view private documents.' : 'Failed to retrieve requested document.',
        });
      },
    });
  }

  downloadPrivateDocument(regId: string, docType: PrivateDocumentType, defaultFileName: string): void {
    this.adminService.getPrivateDocument(this.year, regId, docType).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        alert(err?.status === 403 ? 'Unauthorized to download document.' : 'Failed to download document.');
      },
    });
  }

  closeDocumentViewer(): void {
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
    this.isExporting$.next(true);
    const params: Partial<RegistrationListFilterParams> = {
      search: this.regSearch,
      status: this.regStatusFilter,
      graduationYear: this.regGradYearFilter,
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
        this.errorMessage$.next(err?.error?.message || 'Failed to export registrations CSV.');
      },
    });
  }

  /* ── Filter Helpers ── */
  getFilteredProgramItems(items: MainSegmentAdminProgramItemResponse[]): MainSegmentAdminProgramItemResponse[] {
    if (!items) return [];
    if (this.programFilter === 'All' || this.programFilter === 'Speakers') return items;
    return items.filter((i) => i.category === this.programFilter);
  }

  getFilteredOrganizations(orgs: MainSegmentAdminOrganizationResponse[]): MainSegmentAdminOrganizationResponse[] {
    if (!orgs) return [];
    if (this.orgFilter === 'All') return orgs;
    return orgs.filter((o) => o.category === this.orgFilter);
  }

  getAssignedPeopleNames(personIds: string[], allPeople: MainSegmentAdminPersonResponse[]): string {
    if (!personIds || !allPeople) return 'None';
    const names = allPeople
      .filter((p) => personIds.includes(p.id))
      .map((p) => p.name);
    return names.length > 0 ? names.join(', ') : 'None';
  }

  getPersonAssignedItemTitles(itemIds: string[], allItems: MainSegmentAdminProgramItemResponse[]): string {
    if (!itemIds || !allItems) return 'None';
    const titles = allItems
      .filter((i) => itemIds.includes(i.id))
      .map((i) => i.title);
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

  /* ── Live Preview ── */
  openPreview(): void {
    this.adminService.getPreview(this.year).subscribe({
      next: (preview) => {
        this.previewData$.next(preview);
        this.isPreviewModalOpen$.next(true);
      },
      error: (err) => {
        this.errorMessage$.next(err?.error?.message || 'Failed to load live preview.');
      },
    });
  }

  closePreview(): void {
    this.isPreviewModalOpen$.next(false);
  }

  getSectionTitle(key: MainSegmentSectionKey): string {
    return getSectionDisplayTitle(key);
  }

  getSectionEyebrow(key: MainSegmentSectionKey): string {
    return getSectionEyebrow(key);
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
