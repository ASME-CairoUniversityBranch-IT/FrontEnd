import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Speaker } from '../../../core/models/project.model';

@Component({
  selector: 'app-speakers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speakers.html',
  styleUrls: ['./speakers.css'],
})
export class SpeakersComponent {
  @Input() speakers: Speaker[] = [];

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
