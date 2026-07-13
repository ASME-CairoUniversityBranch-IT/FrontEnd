import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Instructor } from '../../../core/models/project.model';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructors.html',
  styleUrls: ['./instructors.css'],
})
export class InstructorsComponent {
  @Input() instructors: Instructor[] = [];

  initials(fullName: string): string {
    return fullName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}