import { Routes } from '@angular/router';
import { OurValues } from '../components/our-values/our-values';
import { EventsPageComponent } from '../components/projectss-page/events-page';
import { HomePage } from '../components/home-page/home-page';
import { CreateEventComponent } from '../components/create-event/create-event';

export const routes: Routes = [
  {path: '', component: HomePage, pathMatch: 'full'},
  {path: 'events',component: EventsPageComponent},
  {path: 'events/create',component: CreateEventComponent},
];
