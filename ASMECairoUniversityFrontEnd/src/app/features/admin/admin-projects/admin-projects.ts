import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { ProjectsService } from '../../../core/services/projects.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ProjectSummary, ProjectStatus, ProjectType } from '../../../core/models/project.model';
import { ProjectAnalytics } from '../../../core/models/analytics.model';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav';
import { ALL_PROJECT_TYPES, projectDetailPath, projectTypeIcon, projectTypeLabel } from '../../../core/utils/project-route.util';
import { EgyptDatePipe } from '../../../shared/pipes/egypt-date.pipe';

type TypeFilter = ProjectType | 'all';

interface ProjectCardVM {
  summary: ProjectSummary;
  /** null = no views yet, not found, or this admin lacks superadmin access — the card just
   *  hides the stats row rather than showing an error for something this optional. */
  analytics: ProjectAnalytics | null;
  busy: boolean;
}

type ListVM =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; cards: ProjectCardVM[] };

const STATUS_LABEL: Record<ProjectStatus, string> = {
  [ProjectStatus.Draft]: 'Draft',
  [ProjectStatus.Published]: 'Published',
  [ProjectStatus.Closed]: 'Closed',
};

/**
 * Admin project management: every project as a card with its own view stats
 * (GET /api/analytics/projects/{id}), a status control, delete, and an Edit link that hands off
 * to /admin/update-project/:id (see CreateProjectComponent, which doubles as the edit form).
 *
 * Per-project analytics requires superadmin; a plain admin token still sees and manages every
 * project here, just without the view-count line on each card.
 */
@Component({
  selector: 'app-admin-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, AdminNavComponent, EgyptDatePipe],
  templateUrl: './admin-projects.html',
  styleUrl: './admin-projects.css',
})
export class AdminProjectsComponent {
  readonly vm$: Observable<ListVM>;
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  activeFilter: TypeFilter = 'all';
  searchTerm = '';

  readonly types = ALL_PROJECT_TYPES;
  readonly statuses = [ProjectStatus.Draft, ProjectStatus.Published, ProjectStatus.Closed];
  readonly projectTypeLabel = projectTypeLabel;
  readonly projectTypeIcon = projectTypeIcon;
  readonly projectDetailPath = projectDetailPath;
  readonly statusLabel = (s: ProjectStatus): string => STATUS_LABEL[s];

  constructor(
    private projectsService: ProjectsService, 
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef,) {
    this.vm$ = this.reload$.pipe(
      switchMap(() =>
        this.projectsService.getAll().pipe(
          switchMap(summaries => {
            if (summaries.length === 0) return of<ProjectCardVM[]>([]);
            return forkJoin(
              summaries.map(summary =>
                this.analyticsService.getProjectAnalytics(summary.id).pipe(
                  map((analytics): ProjectCardVM => ({ summary, analytics, busy: false })),
                  catchError(() => of<ProjectCardVM>({ summary, analytics: null, busy: false })),
                ),
              ),
            );
          }),
          map((cards): ListVM => ({ status: 'loaded', cards })),
        ),
      ),
      startWith<ListVM>({ status: 'loading' }),
      catchError(() => of<ListVM>({ status: 'error' })),
    );
  }

  filteredCards(cards: ProjectCardVM[]): ProjectCardVM[] {
    const term = this.searchTerm.trim().toLowerCase();
    return cards.filter(
      c =>
        (this.activeFilter === 'all' || c.summary.type === this.activeFilter) &&
        (!term ||
          c.summary.title.toLowerCase().includes(term) ||
          c.summary.shortDescription.toLowerCase().includes(term)),
    );
  }

  setFilter(filter: TypeFilter): void {
    this.activeFilter = filter;
  }

  changeStatus(card: ProjectCardVM, status: ProjectStatus): void {
    if (status === card.summary.status) return;
    card.busy = true;
    this.projectsService.setStatus(card.summary.id, status).subscribe({
      next: () => this.reload$.next(),
      error: () => {
        card.busy = false;
        alert("Couldn't update the project's status — please try again.");
        this.cdr.detectChanges(); // add this
      },
    });
  }

  deleteProject(card: ProjectCardVM): void {
    const confirmed = confirm(
      `Delete "${card.summary.title}"? This removes it and all of its photos/gallery images permanently.`,
    );
    if (!confirmed) return;

    card.busy = true;
    this.projectsService.delete(card.summary.id).subscribe({
      next: () => this.reload$.next(),
      error: () => {
        card.busy = false;
        alert("Couldn't delete this project — please try again.");
        this.cdr.detectChanges(); // add this
      },
    });
  }
}
