export enum MainSegmentEditionStatus {
  Draft = 'Draft',
  Published = 'Published',
  Archived = 'Archived',
}

export enum MainSegmentSectionKey {
  PanelDiscussion = 'PanelDiscussion',
  Talks = 'Talks',
  Workshops = 'Workshops',
  MentorshipCircles = 'MentorshipCircles',
  CareerFair = 'CareerFair',
  CvReviewAndMockInterviews = 'CvReviewAndMockInterviews',
  Sponsors = 'Sponsors',
  Partners = 'Partners',
}

export enum MainSegmentProgramCategory {
  PanelDiscussion = 'PanelDiscussion',
  Talk = 'Talk',
  Workshop = 'Workshop',
  MentorshipCircle = 'MentorshipCircle',
}

export enum MainSegmentOrganizationCategory {
  CareerFair = 'CareerFair',
  CvReviewAndMockInterview = 'CvReviewAndMockInterview',
  Sponsor = 'Sponsor',
  Partner = 'Partner',
}

export type SponsorshipTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string;

export interface MainSegmentRegistration {
  isAvailable: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  capacity?: number | null;
}

export interface MainSegmentPerson {
  id: string;
  name: string;
  jobTitle: string;
  shortBio: string;
  photoUrl?: string | null;
  linkedInUrl?: string | null;
}

export interface MainSegmentProgramItem {
  id: string;
  category: MainSegmentProgramCategory;
  title: string;
  description: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  people: MainSegmentPerson[];
}

export interface MainSegmentOrganization {
  id: string;
  name: string;
  category: MainSegmentOrganizationCategory;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  sponsorTier?: SponsorshipTier | null;
}

export interface MainSegmentSection {
  sectionKey: MainSegmentSectionKey;
  displayOrder: number;
  intro?: string | null;
  programItems: MainSegmentProgramItem[];
  organizations: MainSegmentOrganization[];
}

export interface MainSegmentEdition {
  id: string;
  year: number;
  slug: string;
  title: string;
  heroContent: string;
  heroImageUrl?: string | null;
  storyContent: string;
  startsAt: string;
  endsAt: string;
  location: string;
  registration: MainSegmentRegistration;
  sections: MainSegmentSection[];
}

export interface MainSegmentEditionSummary {
  id: string;
  year: number;
  slug: string;
  title: string;
  status: MainSegmentEditionStatus;
  startsAt: string;
  endsAt: string;
  isRegistrationAvailable: boolean;
  publishedAt?: string | null;
  archivedAt?: string | null;
}
