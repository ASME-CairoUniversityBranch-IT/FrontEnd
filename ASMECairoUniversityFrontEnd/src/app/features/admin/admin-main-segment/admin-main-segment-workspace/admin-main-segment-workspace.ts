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
  MainSegmentAdminResponse,
  MainSegmentAdminSectionResponse,
  MainSegmentEditionStatus,
  MainSegmentSectionKey,
  MainSegmentSectionRequest,
  UpdateMainSegmentEditionRequest,
} from '../../../../core/models/main-segment.model';
import {
  getSectionDisplayTitle,
  getSectionEyebrow,
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

  private showSuccess(msg: string): void {
    this.successMessage$.next(msg);
    setTimeout(() => {
      if (this.successMessage$.value === msg) {
        this.successMessage$.next(null);
      }
    }, 4000);
  }
}
