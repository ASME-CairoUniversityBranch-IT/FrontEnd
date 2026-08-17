/**
 * Shapes for `/api/analytics/*` (see API handover §6). All Analytics endpoints require the
 * `superadmin` role — a non-superadmin token gets a 403, which callers should handle gracefully
 * rather than treating as a hard error (see AnalyticsService doc comment).
 *
 * The handover's example payloads show `type` as a readable string ("Event", "Workshop", ...)
 * on these analytics DTOs specifically — unlike the numeric ProjectType used by the Projects
 * endpoints. `projectTypeFromLabel()` in project-route.util.ts bridges the two when a link back
 * to the project is needed. CONFIRM against a real response; if `type` actually comes back
 * numeric here too, the label lookup falls back to showing the raw value instead of throwing.
 */

export interface ProjectTypeCounts {
  Event: number;
  Workshop: number;
  FieldTrip: number;
  SchoolVisit: number;
  [key: string]: number;
}

export interface TopProject {
  projectId: string;
  title: string;
  type: string;
  viewCount: number;
}

export interface DashboardAnalytics {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  closedProjects: number;
  projectsByType: ProjectTypeCounts;
  totalViews: number;
  totalUniqueViews: number;
  viewsToday: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  mostViewedProject: TopProject | null;
}

export interface TypeViewCount {
  type: string;
  viewCount: number;
}

export interface DailyViewCount {
  date: string;
  count: number;
}

export interface ProjectAnalytics {
  projectId: string;
  title: string;
  totalViews: number;
  uniqueViews: number;
  viewsLast30Days: DailyViewCount[];
}
