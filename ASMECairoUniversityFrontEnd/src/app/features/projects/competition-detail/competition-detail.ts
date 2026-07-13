import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { CompetitionProject, ProjectType } from '../../../core/models/project.model';
import { ProjectDetailVM, buildProjectDetailVM } from '../../../core/utils/project-detail-vm.util';
import { ProjectHeroComponent } from '../../../shared/components/project-hero/project-hero';
import { ProjectGalleryComponent } from '../../../shared/components/project-gallery/project-gallery';
import { ProjectDetailsComponent } from '../../../shared/components/project-sidebar-details/project-sidebar-details';
import { ReservationComponent } from '../../../shared/components/reservation/reservation';
import { PrizeHighlightComponent } from '../../../shared/components/prize-highlight/prize-highlight';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MarkdownComponent, ProjectHeroComponent, ProjectGalleryComponent,
    ProjectDetailsComponent, ReservationComponent, PrizeHighlightComponent,
  ],
  templateUrl: './competition-detail.html',
  styleUrls: ['./competition-detail.css', '../../../shared/styles/project-detail-layout.css', '../../../shared/styles/markdown-body.css'],
})
export class CompetitionDetailComponent {
  readonly vm$: Observable<ProjectDetailVM<CompetitionProject>>;

  constructor(route: ActivatedRoute, projectsService: ProjectsService) {
    this.vm$ = buildProjectDetailVM(route, projectsService, (p): p is CompetitionProject => p.type === ProjectType.Competition);
  }
}
