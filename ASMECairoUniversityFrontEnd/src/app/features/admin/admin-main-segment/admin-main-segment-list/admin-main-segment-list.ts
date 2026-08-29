import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AdminNavComponent } from '../../../../shared/components/admin-nav/admin-nav';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { AdminMainSegmentService } from '../../../../core/services/admin-main-segment.service';
import {
  CreateMainSegmentEditionRequest,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
} from '../../../../core/models/main-segment.model';
import { toInputDateTime, toIsoDateTime } from '../../../../core/utils/main-segment.util';

export type AdminEditionListVM =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; editions: MainSegmentEditionSummary[] };

@Component({
  selector: 'app-admin-main-segment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    AdminNavComponent,
    FocusTrapDirective,
  ],
  templateUrl: './admin-main-segment-list.html',
  styleUrl: './admin-main-segment-list.css',
})
export class AdminMainSegmentListComponent implements OnInit {
  private readonly adminService = inject(AdminMainSegmentService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  readonly isCreateModalOpen$ = new BehaviorSubject<boolean>(false);
  readonly isCreating$ = new BehaviorSubject<boolean>(false);
  readonly createError$ = new BehaviorSubject<string | null>(null);

  readonly createForm: FormGroup = this.fb.group({
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    heroContent: ['Shape the future with engineering leadership and industrial innovation.', [Validators.required]],
    storyContent: ['The annual premiere gathering for mechanical engineers.', [Validators.required]],
    startsAt: [toInputDateTime(new Date().toISOString()), [Validators.required]],
    endsAt: [toInputDateTime(new Date(Date.now() + 86400000).toISOString()), [Validators.required]],
    location: ['Faculty of Engineering, Cairo University', [Validators.required]],
    capacity: [500, [Validators.min(1)]],
  });

  readonly vm$: Observable<AdminEditionListVM> = this.refreshSubject.pipe(
    switchMap(() =>
      this.adminService.getAdminEditions().pipe(
        map((editions): AdminEditionListVM => ({
          status: 'loaded',
          editions: [...editions].sort((a, b) => b.year - a.year),
        })),
        startWith<AdminEditionListVM>({ status: 'loading' }),
        catchError((err) =>
          of<AdminEditionListVM>({
            status: 'error',
            message: err?.error?.message || 'Failed to load Main Segment editions.',
          })
        )
      )
    )
  );

  ngOnInit(): void {
    this.createForm.get('year')?.valueChanges.subscribe((year) => {
      if (year && !this.createForm.get('slug')?.dirty) {
        this.createForm.patchValue({ slug: `main-segment-${year}` }, { emitEvent: false });
      }
      if (year && !this.createForm.get('title')?.dirty) {
        this.createForm.patchValue({ title: `Main Segment ${year}` }, { emitEvent: false });
      }
    });

    const initialYear = this.createForm.get('year')?.value;
    if (initialYear) {
      this.createForm.patchValue({
        slug: `main-segment-${initialYear}`,
        title: `Main Segment ${initialYear}`,
      });
    }
  }

  openCreateModal(): void {
    this.createError$.next(null);
    this.isCreateModalOpen$.next(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen$.next(false);
    this.createError$.next(null);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const val = this.createForm.value;
    const request: CreateMainSegmentEditionRequest = {
      year: Number(val.year),
      slug: val.slug.trim(),
      title: val.title.trim(),
      heroContent: val.heroContent.trim(),
      storyContent: val.storyContent.trim(),
      startsAt: toIsoDateTime(val.startsAt) || new Date().toISOString(),
      endsAt: toIsoDateTime(val.endsAt) || new Date().toISOString(),
      location: val.location.trim(),
      capacity: val.capacity ? Number(val.capacity) : null,
    };

    this.isCreating$.next(true);
    this.createError$.next(null);

    this.adminService.createEdition(request).subscribe({
      next: (created) => {
        this.isCreating$.next(false);
        this.closeCreateModal();
        this.router.navigate(['/admin/main-segment', created.year]);
      },
      error: (err) => {
        this.isCreating$.next(false);
        this.createError$.next(
          err?.error?.message || err?.message || 'Failed to create edition. Please verify input fields.'
        );
      },
    });
  }

  reload(): void {
    this.refreshSubject.next(undefined);
  }
}
