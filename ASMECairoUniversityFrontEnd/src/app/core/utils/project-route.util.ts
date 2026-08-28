import { Project, ProjectType } from '../models/project.model';

/** Maps a ProjectType to its URL segment, display label and icon class — single source of truth
 *  so list/detail/create pages never hardcode these strings separately. */
const TYPE_META: Record<ProjectType, { segment: string; label: string; icon: string }> = {
  [ProjectType.Event]:       { segment: 'events',       label: 'Events',             icon: 'fa-solid fa-calendar-days' },
  [ProjectType.Workshop]:    { segment: 'workshops',    label: 'Academic Workshops', icon: 'fa-solid fa-chalkboard-user' },
  [ProjectType.FieldTrip]:   { segment: 'fieldtrips',   label: 'Field Trips',        icon: 'fa-solid fa-bus-simple' },
  [ProjectType.SchoolVisit]: { segment: 'schoolvisits', label: 'School Visits',      icon: 'fa-solid fa-school' },
};

export const projectTypeSegment = (type: ProjectType): string => TYPE_META[type].segment;
export const projectTypeLabel = (type: ProjectType): string => TYPE_META[type].label;
export const projectTypeIcon = (type: ProjectType): string => TYPE_META[type].icon;

/** `{type}` path segment used by `POST/PUT /api/projects/{type}` (events/workshops/fieldtrips/schoolvisits) —
 *  same string as the URL segment, kept as a separate export so call sites reading the API handover
 *  table can match the name used there. */
export const projectApiTypeSegment = (type: ProjectType): string => TYPE_META[type].segment;

export const projectDetailPath = (p: Pick<Project, 'type' | 'id'>): string[] =>
  ['/', projectTypeSegment(p.type), p.id];

export const ALL_PROJECT_TYPES: ProjectType[] = [
  ProjectType.Event,
  ProjectType.Workshop,
  ProjectType.FieldTrip,
  ProjectType.SchoolVisit,
];

/** Bridges the readable `type` strings used in Analytics responses (e.g. "Event") back to the
 *  numeric ProjectType used everywhere else, so an analytics card can link to the project detail
 *  page. Returns null for anything unrecognized instead of throwing — analytics is a bonus display,
 *  not something that should break the page if the backend's shape differs from what's assumed here. */
export function projectTypeFromLabel(label: string | number | null | undefined): ProjectType | null {
  if (label === null || label === undefined) return null;
  if (typeof label === 'number') {
    return label in TYPE_META ? (label as ProjectType) : null;
  }

  const normalizedLabel = label.trim().toLowerCase().replace(/\s+/g, ' ');
  const singularize = (value: string): string => value.endsWith('s') ? value.slice(0, -1) : value;
  const spacedEnumName = (type: ProjectType): string =>
    ProjectType[type].replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

  const found = (Object.keys(TYPE_META) as unknown as ProjectType[]).find(t => {
    const candidates = [TYPE_META[t].label.toLowerCase(), spacedEnumName(t)];
    return candidates.some(candidate =>
      normalizedLabel === candidate || normalizedLabel === singularize(candidate),
    );
  });
  return found !== undefined ? found : null;
}
