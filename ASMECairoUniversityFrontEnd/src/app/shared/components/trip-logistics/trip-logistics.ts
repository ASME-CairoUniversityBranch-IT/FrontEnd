import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTripProject } from '../../../core/models/project.model';

@Component({
  selector: 'app-trip-logistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-logistics.html',
  styleUrls: ['./trip-logistics.css'],
})
export class TripLogisticsComponent {
  @Input() trip: FieldTripProject | null = null;
}
