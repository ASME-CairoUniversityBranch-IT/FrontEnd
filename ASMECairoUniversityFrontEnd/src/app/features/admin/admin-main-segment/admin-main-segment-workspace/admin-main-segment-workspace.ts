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

  /* ── Filter Categories ── */
  programFilter: string = 'All';
  orgFilter: string = 'All';

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
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): boolean {
    if (this.form.dirty) {
      return confirm(
        'You have unsaved changes in this edition workspace. Are you sure you want to navigate away?'
      );
    }
    return true;
  }

  setTab(tab: WorkspaceTab): void {
    this.activeTab = tab;
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

  /* ── Filter Helpers ── */
  setProgramFilter(filter: string): void { this.programFilter = filter; }

  setOrgFilter(filter: string): void { this.orgFilter = filter; }

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
