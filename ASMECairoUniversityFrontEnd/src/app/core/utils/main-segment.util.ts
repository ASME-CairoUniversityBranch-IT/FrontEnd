import {
  MainSegmentOrganization,
  MainSegmentSection,
  MainSegmentSectionKey,
} from '../models/main-segment.model';

export interface SponsorGroup {
  tierName: string;
  tierClass: string;
  order: number;
  organizations: MainSegmentOrganization[];
}

export const SPONSOR_TIER_ORDER: Record<string, number> = {
  strategic: 0,
  platinum: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
};

/**
 * Returns clean initials for a person (e.g. "Jane Smith" -> "JS").
 */
export function getPersonInitials(name: string): string {
  if (!name) return 'SP';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns clean initials for an organization (e.g. "Tech Corp" -> "TC").
 */
export function getOrgInitials(name: string): string {
  if (!name) return 'ORG';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ORG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Groups sponsors by their tier with explicit descending priority order.
 */
export function groupSponsorsByTier(sponsors: MainSegmentOrganization[]): SponsorGroup[] {
  if (!sponsors || sponsors.length === 0) return [];

  const map = new Map<string, MainSegmentOrganization[]>();

  for (const org of sponsors) {
    const rawTier = org.sponsorTier ? String(org.sponsorTier).trim() : 'General Sponsor';
    const list = map.get(rawTier) || [];
    list.push(org);
    map.set(rawTier, list);
  }

  const groups: SponsorGroup[] = [];
  for (const [tierName, orgs] of map.entries()) {
    const key = tierName.toLowerCase();
    const order = SPONSOR_TIER_ORDER[key] ?? 99;
    groups.push({
      tierName,
      tierClass: `tier-${key.replace(/[^a-z0-9]/g, '-')}`,
      order,
      organizations: orgs,
    });
  }

  return groups.sort((a, b) => a.order - b.order);
}

/**
 * Checks whether a section has publishable content.
 */
export function hasSectionContent(section: MainSegmentSection): boolean {
  if (!section) return false;
  const hasItems = Array.isArray(section.programItems) && section.programItems.length > 0;
  const hasOrgs = Array.isArray(section.organizations) && section.organizations.length > 0;
  const hasIntro = Boolean(section.intro && section.intro.trim().length > 0);
  return hasItems || hasOrgs || hasIntro;
}

/**
 * Provides an accessible display title for a section key.
 */
export function getSectionDisplayTitle(sectionKey: MainSegmentSectionKey): string {
  switch (sectionKey) {
    case MainSegmentSectionKey.PanelDiscussion:
      return 'Panel Discussions';
    case MainSegmentSectionKey.Talks:
      return 'Keynote & Technical Talks';
    case MainSegmentSectionKey.Workshops:
      return 'Hands-on Workshops';
    case MainSegmentSectionKey.MentorshipCircles:
      return 'Mentorship Circles';
    case MainSegmentSectionKey.CareerFair:
      return 'Career Fair';
    case MainSegmentSectionKey.CvReviewAndMockInterviews:
      return 'CV Review & Mock Interviews';
    case MainSegmentSectionKey.Sponsors:
      return 'Our Sponsors';
    case MainSegmentSectionKey.Partners:
      return 'Collaboration Partners';
    default:
      return String(sectionKey);
  }
}

/**
 * Provides an engineering journey milestone eyebrow for a section key.
 */
export function getSectionEyebrow(sectionKey: MainSegmentSectionKey): string {
  switch (sectionKey) {
    case MainSegmentSectionKey.PanelDiscussion:
      return 'Perspective';
    case MainSegmentSectionKey.Talks:
      return 'Knowledge';
    case MainSegmentSectionKey.Workshops:
      return 'Practice';
    case MainSegmentSectionKey.MentorshipCircles:
      return 'Direction';
    case MainSegmentSectionKey.CareerFair:
      return 'Opportunity';
    case MainSegmentSectionKey.CvReviewAndMockInterviews:
      return 'Readiness';
    case MainSegmentSectionKey.Sponsors:
      return 'Innovation & Support';
    case MainSegmentSectionKey.Partners:
      return 'Community & Academic';
    default:
      return 'Event Segment';
  }
}

/**
 * Formats an ISO string to 'YYYY-MM-DDTHH:mm' for datetime-local inputs.
 */
export function toInputDateTime(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local input string to an ISO 8601 string.
 */
export function toIsoDateTime(inputVal?: string | null): string | null {
  if (!inputVal || !inputVal.trim()) return null;
  const d = new Date(inputVal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
