import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { SchoolVisitProject, ProjectType } from '../../../core/models/project.model';
import { ProjectDetailVM, buildProjectDetailVM } from '../../../core/utils/project-detail-vm.util';
import { ProjectHeroComponent } from '../../../shared/components/project-hero/project-hero';
import { ProjectGalleryComponent } from '../../../shared/components/project-gallery/project-gallery';
import { ProjectDetailsComponent } from '../../../shared/components/project-sidebar-details/project-sidebar-details';
import { ReservationComponent } from '../../../shared/components/reservation/reservation';
import { SchoolVisitHighlightComponent } from '../../../shared/components/school-visit-highlight/school-visit-highlight';

@Component({
  selector: 'app-school-visit-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MarkdownComponent, ProjectHeroComponent, ProjectGalleryComponent,
    ProjectDetailsComponent, ReservationComponent, SchoolVisitHighlightComponent,
  ],
  templateUrl: './school-visit-detail.html',
  styleUrls: ['./school-visit-detail.css', '../../../shared/styles/project-detail-layout.css', '../../../shared/styles/markdown-body.css'],
})
export class SchoolVisitDetailComponent {
  readonly vm$: Observable<ProjectDetailVM<SchoolVisitProject>>;

  constructor(route: ActivatedRoute, projectsService: ProjectsService) {
    this.vm$ = buildProjectDetailVM(route, projectsService, (p): p is SchoolVisitProject => p.type === ProjectType.SchoolVisit);
  }
}
