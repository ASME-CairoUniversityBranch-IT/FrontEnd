import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export type AdminNavSection = 'dashboard' | 'projects' | 'create' | 'edit';

const BREADCRUMB: Record<AdminNavSection, string> = {
  dashboard: 'DASHBOARD',
  projects: 'PROJECTS',
  create: 'CREATE PROJECT',
  edit: 'EDIT PROJECT',
};

/**
 * Shared chrome for every /admin/* page — the dark top bar and left sidebar seen across
 * create-project, admin-projects and admin-dashboard. Renders its content via `<ng-content>`
 * inside the same `.layout` flex row the sidebar sits in, so each page just does:
 *
 *   <app-admin-nav active="projects">
 *     <main class="page-content">...</main>
 *   </app-admin-nav>
 *
 * and keeps its own page-specific styles scoped to whatever it puts inside.
 */
@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.css',
})
export class AdminNavComponent {
  @Input() active: AdminNavSection = 'dashboard';

  constructor(protected authService: AuthService, private router: Router) {}

  get breadcrumb(): string {
    return BREADCRUMB[this.active];
  }

  get adminInitial(): string {
    const name = this.authService.currentUser()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
