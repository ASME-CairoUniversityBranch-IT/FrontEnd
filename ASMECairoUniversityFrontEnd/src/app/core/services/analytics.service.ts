import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardAnalytics, ProjectAnalytics, TopProject, TypeViewCount } from '../models/analytics.model';

/**
 * Wraps `/api/analytics/*` (handover §6). Every endpoint here requires the `superadmin` role —
 * a token belonging to a regular admin gets a 403. Callers should treat that the same way the
 * rest of this app treats auth failures (per auth.interceptor.ts's doc comment): don't redirect,
 * just let the component decide how to show "you don't have access to this" instead of data.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(`${this.baseUrl}/dashboard`);
  }

  /** Single-project total/unique views + a daily breakdown for the last 30 days. 404 if the
   *  project doesn't exist. `viewsLast30Days` only contains days with at least one view — fill
   *  gaps client-side if charting it. */
  getProjectAnalytics(projectId: string): Observable<ProjectAnalytics> {
    return this.http.get<ProjectAnalytics>(`${this.baseUrl}/projects/${projectId}`);
  }

  getTopProjects(count = 10): Observable<TopProject[]> {
    const params = new HttpParams().set('count', count);
    return this.http.get<TopProject[]>(`${this.baseUrl}/top`, { params });
  }

  getByType(): Observable<TypeViewCount[]> {
    return this.http.get<TypeViewCount[]>(`${this.baseUrl}/by-type`);
  }
}
