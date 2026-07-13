import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-hero.html',
  styleUrls: ['./project-hero.css'],
})
export class ProjectHeroComponent {
  @Input() project: Project | null = null;
  @Input() typeLabel = '';
}
