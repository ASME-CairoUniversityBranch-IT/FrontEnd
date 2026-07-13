import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Partner } from '../../../core/models/project.model';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partners.html',
  styleUrls: ['./partners.css'],
})
export class PartnersComponent {
  @Input() partners: Partner[] = [];
}
