import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { EventProject, ProjectType } from '../../../core/models/project.model';
import { ProjectDetailVM, buildProjectDetailVM } from '../../../core/utils/project-detail-vm.util';
import { ProjectHeroComponent } from '../../../shared/components/project-hero/project-hero';
import { ProjectGalleryComponent } from '../../../shared/components/project-gallery/project-gallery';
import { ProjectDetailsComponent } from '../../../shared/components/project-sidebar-details/project-sidebar-details';
import { ReservationComponent } from '../../../shared/components/reservation/reservation';
import { SponsersComponent } from '../../../shared/components/sponsers/sponsers';
import { SpeakersComponent } from '../../../shared/components/speakers/speakers';
import { PartnersComponent } from '../../../shared/components/partners/partners';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, MarkdownComponent, ProjectHeroComponent, ProjectGalleryComponent,
    ProjectDetailsComponent, ReservationComponent, SponsersComponent, SpeakersComponent, PartnersComponent,
  ],
  templateUrl: './event-detail.html',
  styleUrls: ['./event-detail.css', '../../../shared/styles/project-detail-layout.css', '../../../shared/styles/markdown-body.css'],
})
export class EventDetailComponent {
  readonly vm$: Observable<ProjectDetailVM<EventProject>>;

  constructor(route: ActivatedRoute, projectsService: ProjectsService) {
    this.vm$ = buildProjectDetailVM(route, projectsService, (p): p is EventProject => p.type === ProjectType.Event);
  }
}
