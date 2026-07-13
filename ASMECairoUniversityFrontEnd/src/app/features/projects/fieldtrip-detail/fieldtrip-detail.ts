import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { FieldTripProject, ProjectType } from '../../../core/models/project.model';
import { ProjectDetailVM, buildProjectDetailVM } from '../../../core/utils/project-detail-vm.util';
import { ProjectHeroComponent } from '../../../shared/components/project-hero/project-hero';
import { ProjectGalleryComponent } from '../../../shared/components/project-gallery/project-gallery';
import { ProjectDetailsComponent } from '../../../shared/components/project-sidebar-details/project-sidebar-details';
import { ReservationComponent } from '../../../shared/components/reservation/reservation';
import { TripLogisticsComponent } from '../../../shared/components/trip-logistics/trip-logistics';

@Component({
  selector: 'app-fieldtrip-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MarkdownComponent, ProjectHeroComponent, ProjectGalleryComponent,
    ProjectDetailsComponent, ReservationComponent, TripLogisticsComponent,
  ],
  templateUrl: './fieldtrip-detail.html',
  styleUrls: ['./fieldtrip-detail.css', '../../../shared/styles/project-detail-layout.css', '../../../shared/styles/markdown-body.css'],
})
export class FieldTripDetailComponent {
  readonly vm$: Observable<ProjectDetailVM<FieldTripProject>>;

  constructor(route: ActivatedRoute, projectsService: ProjectsService) {
    this.vm$ = buildProjectDetailVM(route, projectsService, (p): p is FieldTripProject => p.type === ProjectType.FieldTrip);
  }
}
