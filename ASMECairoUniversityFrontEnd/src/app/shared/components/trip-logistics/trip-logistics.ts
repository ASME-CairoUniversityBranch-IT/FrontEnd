import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTripProject } from '../../../core/models/project.model';
import { EgyptDatePipe } from '../../pipes/egypt-date.pipe';

@Component({
  selector: 'app-trip-logistics',
  standalone: true,
  imports: [CommonModule, EgyptDatePipe],
  templateUrl: './trip-logistics.html',
  styleUrls: ['./trip-logistics.css'],
})
export class TripLogisticsComponent {
  @Input() trip: FieldTripProject | null = null;
}
