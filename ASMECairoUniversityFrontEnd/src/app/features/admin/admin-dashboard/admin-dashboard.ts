import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DashboardAnalytics, TopProject, TypeViewCount } from '../../../core/models/analytics.model';
import { AdminNavComponent } from '../../../shared/components/admin-nav/admin-nav';
import { projectDetailPath, projectTypeFromLabel, projectTypeIcon } from '../../../core/utils/project-route.util';

type DashboardVM =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'error' }
  | { status: 'loaded'; dashboard: DashboardAnalytics; topProjects: TopProject[]; byType: TypeViewCount[] };

/**
 * Site-wide analytics overview (GET /api/analytics/dashboard + /top + /by-type). Deliberately
 * excludes per-project analytics (GET /api/analytics/projects/{id}) — that lives on the
 * admin-projects page, next to each project's card, not here.
 *
 * All three calls require the superadmin role; a plain admin token gets a 403, which is shown
 * as a plain "you need superadmin access" message rather than a hard error, since this is a
 * legitimate, expected state for some admins to be in.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, AdminNavComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent {
  readonly vm$: Observable<DashboardVM>;

  constructor(private analyticsService: AnalyticsService) {
    this.vm$ = forkJoin({
      dashboard: this.analyticsService.getDashboard(),
      topProjects: this.analyticsService.getTopProjects(5),
      byType: this.analyticsService.getByType(),
    }).pipe(
      map((result): DashboardVM => ({ status: 'loaded', ...result })),
      startWith<DashboardVM>({ status: 'loading' }),
      catchError((err: HttpErrorResponse) =>
        of<DashboardVM>({ status: err.status === 403 ? 'forbidden' : 'error' }),
      ),
    );
  }

  /** Best-effort link from an analytics row back to the project's public detail page. Analytics
   *  DTOs report `type` as a readable string ("Event"), unlike the numeric ProjectType used
   *  elsewhere — projectTypeFromLabel() bridges the two. Falls back to the projects list if the
   *  label can't be matched, rather than producing a broken link. */
  detailPath(projectId: string, typeLabel: string): string[] {
    const type = projectTypeFromLabel(typeLabel);
    return type !== null ? projectDetailPath({ type, id: projectId }) : ['/projects'];
  }

  iconFor(typeLabel: string): string {
    const type = projectTypeFromLabel(typeLabel);
    return type !== null ? projectTypeIcon(type) : '📁';
  }

  typeCountEntries(dashboard: DashboardAnalytics): { label: string; count: number }[] {
    return Object.entries(dashboard.projectsByType).map(([label, count]) => ({ label, count }));
  }
}
