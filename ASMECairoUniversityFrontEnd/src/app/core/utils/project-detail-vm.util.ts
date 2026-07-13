import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { ProjectsService } from '../services/projects.service';

/** View-model for a single project-detail page, driven entirely through the `async` pipe.
 *  No component ever sets `loading`/`project`/`notFound` fields by hand, so there's nothing
 *  for change detection to miss — the async pipe marks the view dirty for every emission. */
export type ProjectDetailVM<T> =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'loaded'; project: T };

/**
 * Builds the `vm$` observable for a project-detail component.
 *
 * - Re-fetches whenever the `:id` route param changes (switchMap on paramMap, not a one-time
 *   snapshot read), so navigating from one project straight to another of the same type works too.
 * - `startWith({status:'loading'})` makes the loading state part of the stream itself, instead of
 *   a field that has to be manually reset to `false` in every `next`/`error` callback.
 * - `isMatch` narrows `Project` to the specific subtype (Event/Workshop/FieldTrip/Competition) —
 *   if the id resolves to the wrong project type, we treat it as not-found (wrong route prefix).
 */
export function buildProjectDetailVM<T extends Project>(
  route: ActivatedRoute,
  projectsService: ProjectsService,
  isMatch: (p: Project) => p is T,
): Observable<ProjectDetailVM<T>> {
  return route.paramMap.pipe(
    map(params => params.get('id')!),
    switchMap(id =>
      projectsService.getById(id).pipe(
        map((p): ProjectDetailVM<T> => (isMatch(p) ? { status: 'loaded', project: p } : { status: 'notFound' })),
        startWith<ProjectDetailVM<T>>({ status: 'loading' }),
        catchError(() => of<ProjectDetailVM<T>>({ status: 'notFound' })),
      ),
    ),
  );
}
