import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProjectsService } from '../../../core/services/projects.service';
import { ProjectSummary, ProjectType } from '../../../core/models/project.model';
import { ALL_PROJECT_TYPES, projectDetailPath, projectTypeIcon, projectTypeLabel } from '../../../core/utils/project-route.util';
import { EgyptDatePipe } from '../../../shared/pipes/egypt-date.pipe';

type TypeFilter = ProjectType | 'all';

type ProjectsListVM =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; projects: ProjectSummary[] };

@Component({
  selector: 'app-projects-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, EgyptDatePipe],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.css',
})
export class ProjectsListComponent {
  readonly vm$: Observable<ProjectsListVM>;

  activeFilter: TypeFilter = 'all';
  searchTerm = '';

  readonly types = ALL_PROJECT_TYPES;
  readonly projectTypeLabel = projectTypeLabel;
  readonly projectTypeIcon = projectTypeIcon;
  readonly projectDetailPath = projectDetailPath;

  constructor(projectsService: ProjectsService) {
    this.vm$ = projectsService.getAllPublished().pipe(
      map((projects): ProjectsListVM => ({ status: 'loaded', projects })),
      startWith<ProjectsListVM>({ status: 'loading' }),
      catchError(() => of<ProjectsListVM>({ status: 'error' })),
    );
  }

  /** Applies the current filter/search — kept as plain component state (not part of vm$) since
   *  it's local UI state, not data that needs to be re-fetched from the server. */
  filteredProjects(projects: ProjectSummary[]): ProjectSummary[] {
    const term = this.searchTerm.trim().toLowerCase();
    return projects.filter(p =>
      (this.activeFilter === 'all' || p.type === this.activeFilter) &&
      (!term || p.title.toLowerCase().includes(term) || p.shortDescription.toLowerCase().includes(term))
    );
  }

  setFilter(filter: TypeFilter): void {
    this.activeFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
