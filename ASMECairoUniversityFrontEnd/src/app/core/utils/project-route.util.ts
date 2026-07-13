import { Project, ProjectType } from '../models/project.model';

/** Maps a ProjectType to its URL segment, display label and emoji — single source of truth
 *  so list/detail/create pages never hardcode these strings separately. */
const TYPE_META: Record<ProjectType, { segment: string; label: string; icon: string }> = {
  [ProjectType.Event]:       { segment: 'events',       label: 'Event',       icon: '🚀' },
  [ProjectType.Workshop]:    { segment: 'workshops',    label: 'Workshop',    icon: '🖥️' },
  [ProjectType.FieldTrip]:   { segment: 'fieldtrips',   label: 'Field Trip',  icon: '🏭' },
  [ProjectType.Competition]: { segment: 'competitions', label: 'Competition', icon: '🏁' },
};

export const projectTypeSegment = (type: ProjectType): string => TYPE_META[type].segment;
export const projectTypeLabel = (type: ProjectType): string => TYPE_META[type].label;
export const projectTypeIcon = (type: ProjectType): string => TYPE_META[type].icon;

export const projectDetailPath = (p: Pick<Project, 'type' | 'id'>): string[] =>
  ['/', projectTypeSegment(p.type), p.id];

export const ALL_PROJECT_TYPES: ProjectType[] = [
  ProjectType.Event,
  ProjectType.Workshop,
  ProjectType.FieldTrip,
  ProjectType.Competition,
];
