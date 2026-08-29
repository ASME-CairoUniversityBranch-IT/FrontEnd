import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { mainSegmentRedirectGuard } from './core/guards/main-segment-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home-page/home-page').then(m => m.HomePage),
  },
  {
    path: 'main-segment',
    canActivate: [mainSegmentRedirectGuard],
    loadComponent: () => import('./features/main-segment/main-segment-page/main-segment-page').then(m => m.MainSegmentPageComponent),
  },
  {
    path: 'main-segment/:year',
    loadComponent: () => import('./features/main-segment/main-segment-page/main-segment-page').then(m => m.MainSegmentPageComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/projects-list/projects-list').then(m => m.ProjectsListComponent),
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/projects/event-detail/event-detail').then(m => m.EventDetailComponent),
  },
  {
    path: 'workshops/:id',
    loadComponent: () => import('./features/projects/workshop-detail/workshop-detail').then(m => m.WorkshopDetailComponent),
  },
  {
    path: 'fieldtrips/:id',
    loadComponent: () => import('./features/projects/fieldtrip-detail/fieldtrip-detail').then(m => m.FieldTripDetailComponent),
  },
  {
    path: 'schoolvisits/:id',
    loadComponent: () => import('./features/projects/school-visit-detail/school-visit-detail').then(m => m.SchoolVisitDetailComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },

  // ── Admin section ──
  // authGuard is applied directly on each of these (rather than relying on guard inheritance
  // from a parent route) so every admin page independently bounces an unauthenticated visitor
  // to /login with a returnUrl. Every other route in the app stays reachable without a token.
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'admin/projects',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-projects/admin-projects').then(m => m.AdminProjectsComponent),
  },
  {
    path: 'admin/create-project',
    canActivate: [authGuard],
    loadComponent: () => import('./features/projects/create-project/create-project').then(m => m.CreateProjectComponent),
  },
  {
    path: 'admin/update-project/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/projects/create-project/create-project').then(m => m.CreateProjectComponent),
  },

  // Back-compat: the create form used to live at /projects/create.
  { path: 'projects/create', redirectTo: 'admin/create-project' },

  // Keep unknown public URLs inside the normal site chrome with a useful recovery path.
  { path: '**', loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent) },
];
