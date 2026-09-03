import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProjectsService } from '../../app/core/services/projects.service';
import { ProjectSummary, ProjectType } from '../../app/core/models/project.model';
import { ALL_PROJECT_TYPES, projectDetailPath, projectTypeIcon, projectTypeLabel } from '../../app/core/utils/project-route.util';
import { EgyptDatePipe } from '../../app/shared/pipes/egypt-date.pipe';

type OurProjectsVM =
  | { status: 'loading' }
  | { status: 'loaded'; projects: ProjectSummary[] };

@Component({
  selector: 'app-our-project',
  imports: [CommonModule, RouterModule, EgyptDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './our-projects.html',
  styleUrl: './our-projects.css',
})
export class OurProject {
  readonly tabs = ALL_PROJECT_TYPES;
  readonly projectTypeLabel = projectTypeLabel;
  readonly projectTypeIcon = projectTypeIcon;
  readonly projectDetailPath = projectDetailPath;

  readonly vm$: Observable<OurProjectsVM>;

  activeTab: ProjectType = ProjectType.Event;

  constructor(private projectsService: ProjectsService) {
    this.vm$ = this.projectsService.getAllPublished().pipe(
      map((projects): OurProjectsVM => ({ status: 'loaded', projects })),
      startWith<OurProjectsVM>({ status: 'loading' }),
      // If the request fails here, fail quietly to an empty loaded state — this is a homepage
      // teaser section, not worth showing an error banner for.
      catchError(() => of<OurProjectsVM>({ status: 'loaded', projects: [] })),
    );
  }

  /** Filters+caps the already-loaded projects to the active tab — plain function over vm$'s
   *  data, since switching tabs is local UI state and shouldn't re-trigger a fetch. */
  projectsForTab(projects: ProjectSummary[]): ProjectSummary[] {
    return projects.filter(p => p.type === this.activeTab).slice(0, 3);
  }

  switchTab(tab: ProjectType): void {
    this.activeTab = tab;
  }
}
