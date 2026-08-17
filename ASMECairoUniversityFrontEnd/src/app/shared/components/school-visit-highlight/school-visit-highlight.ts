import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolVisitProject } from '../../../core/models/project.model';

@Component({
  selector: 'app-school-visit-highlight',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './school-visit-highlight.html',
  styleUrls: ['./school-visit-highlight.css'],
})
export class SchoolVisitHighlightComponent {
  @Input() visit: SchoolVisitProject | null = null;
}
