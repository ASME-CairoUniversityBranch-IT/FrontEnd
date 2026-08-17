import { Routes } from '@angular/router';
import { HomePage } from './features/home/home-page/home-page';
import { ProjectsListComponent } from './features/projects/projects-list/projects-list';
import { CreateProjectComponent } from './features/projects/create-project/create-project';
import { EventDetailComponent } from './features/projects/event-detail/event-detail';
import { WorkshopDetailComponent } from './features/projects/workshop-detail/workshop-detail';
import { FieldTripDetailComponent } from './features/projects/fieldtrip-detail/fieldtrip-detail';
import { SchoolVisitDetailComponent } from './features/projects/school-visit-detail/school-visit-detail';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard';
import { AdminProjectsComponent } from './features/admin/admin-projects/admin-projects';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'projects', component: ProjectsListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'workshops/:id', component: WorkshopDetailComponent },
  { path: 'fieldtrips/:id', component: FieldTripDetailComponent },
  { path: 'schoolvisits/:id', component: SchoolVisitDetailComponent },
  { path: 'login', component: LoginComponent },

  // ── Admin section ──
  // authGuard is applied directly on each of these (rather than relying on guard inheritance
  // from a parent route) so every admin page independently bounces an unauthenticated visitor
  // to /login with a returnUrl. Every other route in the app stays reachable without a token.
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'admin/projects', component: AdminProjectsComponent, canActivate: [authGuard] },
  { path: 'admin/create-project', component: CreateProjectComponent, canActivate: [authGuard] },
  { path: 'admin/update-project/:id', component: CreateProjectComponent, canActivate: [authGuard] },

  // Back-compat: the create form used to live at /projects/create.
  { path: 'projects/create', redirectTo: 'admin/create-project' },
];
