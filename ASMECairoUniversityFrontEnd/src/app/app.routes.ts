import { Routes } from '@angular/router';
import { HomePage } from './features/home/home-page/home-page';
import { ProjectsListComponent } from './features/projects/projects-list/projects-list';
import { CreateProjectComponent } from './features/projects/create-project/create-project';
import { EventDetailComponent } from './features/projects/event-detail/event-detail';
import { WorkshopDetailComponent } from './features/projects/workshop-detail/workshop-detail';
import { FieldTripDetailComponent } from './features/projects/fieldtrip-detail/fieldtrip-detail';
import { CompetitionDetailComponent } from './features/projects/competition-detail/competition-detail';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'projects', component: ProjectsListComponent },
  // authGuard is intentionally only applied here: this is the one place in the
  // app the login form is ever shown. Every other route stays reachable even
  // without a valid token.
  { path: 'projects/create', component: CreateProjectComponent, canActivate: [authGuard] },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'workshops/:id', component: WorkshopDetailComponent },
  { path: 'fieldtrips/:id', component: FieldTripDetailComponent },
  { path: 'competitions/:id', component: CompetitionDetailComponent },
  { path: 'login', component: LoginComponent },
];
