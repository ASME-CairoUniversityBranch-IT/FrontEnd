import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, ProjectType } from '../../../core/models/project.model';
import { EgyptDatePipe } from '../../pipes/egypt-date.pipe';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, EgyptDatePipe],
  templateUrl: './project-sidebar-details.html',
  styleUrls: ['./project-sidebar-details.css'],
})
export class ProjectDetailsComponent {
  @Input() project: Project | null = null;
  readonly ProjectType = ProjectType; // exposed for the template's *ngIf

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  }
}
