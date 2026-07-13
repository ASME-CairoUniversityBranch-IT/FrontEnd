import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { WorkshopProject, ProjectType } from '../../../core/models/project.model';
import { ProjectDetailVM, buildProjectDetailVM } from '../../../core/utils/project-detail-vm.util';
import { ProjectHeroComponent } from '../../../shared/components/project-hero/project-hero';
import { ProjectGalleryComponent } from '../../../shared/components/project-gallery/project-gallery';
import { ProjectDetailsComponent } from '../../../shared/components/project-sidebar-details/project-sidebar-details';
import { ReservationComponent } from '../../../shared/components/reservation/reservation';
import { InstructorsComponent } from '../../../shared/components/instructors/instructors';

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MarkdownComponent, ProjectHeroComponent, ProjectGalleryComponent,
    ProjectDetailsComponent, ReservationComponent, InstructorsComponent,
  ],
  templateUrl: './workshop-detail.html',
  styleUrls: ['./workshop-detail.css', '../../../shared/styles/project-detail-layout.css', '../../../shared/styles/markdown-body.css'],
})
export class WorkshopDetailComponent {
  readonly vm$: Observable<ProjectDetailVM<WorkshopProject>>;

  constructor(route: ActivatedRoute, projectsService: ProjectsService) {
    this.vm$ = buildProjectDetailVM(route, projectsService, (p): p is WorkshopProject => p.type === ProjectType.Workshop);
  }
}
