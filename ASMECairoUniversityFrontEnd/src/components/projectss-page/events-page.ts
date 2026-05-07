import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventDetailsComponent } from '../event-details/event-details';
import { EventGalleryComponent } from '../event-gallery/event-gallery';
import { SponsersComponent } from '../sponsers/sponsers';
import { ReservationComponent } from '../reservation/reservation';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-events-page',
  imports: [CommonModule, EventDetailsComponent, EventGalleryComponent, SponsersComponent, ReservationComponent, RouterModule],
  templateUrl: './events-page.html',
  styleUrl: './events-page.css',
})
export class EventsPageComponent {

}
