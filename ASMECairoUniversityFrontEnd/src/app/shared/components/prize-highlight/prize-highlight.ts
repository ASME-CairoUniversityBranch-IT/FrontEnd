import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetitionProject, PrizeCurrency } from '../../../core/models/project.model';

@Component({
  selector: 'app-prize-highlight',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prize-highlight.html',
  styleUrls: ['./prize-highlight.css'],
})
export class PrizeHighlightComponent {
  @Input() competition: CompetitionProject | null = null;
  readonly PrizeCurrency = PrizeCurrency;
}
