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

export type SponsorshipTier = 'Strategic' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | string;

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

/* ─────────────────────────────────────────────────────────────
   Admin DTOs and Requests
   ───────────────────────────────────────────────────────────── */

export interface MainSegmentAdminSectionResponse {
  id: string;
  sectionKey: MainSegmentSectionKey;
  isVisible: boolean;
  displayOrder: number;
}

export interface MainSegmentAdminProgramItemResponse {
  id: string;
  category: MainSegmentProgramCategory;
  title: string;
  description: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  isVisible: boolean;
  displayOrder: number;
  personIds: string[];
}

export interface MainSegmentAdminPersonResponse {
  id: string;
  name: string;
  jobTitle: string;
  shortBio: string;
  photoUrl?: string | null;
  linkedInUrl?: string | null;
  displayOrder: number;
  programItemIds: string[];
}

export interface MainSegmentAdminOrganizationResponse {
  id: string;
  name: string;
  category: MainSegmentOrganizationCategory;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  sponsorTier?: SponsorshipTier | null;
  isVisible: boolean;
  displayOrder: number;
}

export interface MainSegmentAdminResponse {
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
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  capacity?: number | null;
  status: MainSegmentEditionStatus;
  publishedAt?: string | null;
  archivedAt?: string | null;
  registrationAvailabilityOverride?: boolean | null;
  isRegistrationAvailable: boolean;
  careerFairIntro?: string | null;
  cvReviewAndMockInterviewsIntro?: string | null;
  sections: MainSegmentAdminSectionResponse[];
  programItems: MainSegmentAdminProgramItemResponse[];
  people: MainSegmentAdminPersonResponse[];
  organizations: MainSegmentAdminOrganizationResponse[];
}

export interface MainSegmentSectionRequest {
  sectionKey: MainSegmentSectionKey;
  isVisible: boolean;
  displayOrder: number;
}

export interface MainSegmentEditionSettingsRequest {
  slug: string;
  title: string;
  heroContent: string;
  storyContent: string;
  startsAt: string;
  endsAt: string;
  location: string;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  capacity?: number | null;
  registrationAvailabilityOverride?: boolean | null;
  careerFairIntro?: string | null;
  cvReviewAndMockInterviewsIntro?: string | null;
  sections?: MainSegmentSectionRequest[] | null;
}

export interface CreateMainSegmentEditionRequest extends MainSegmentEditionSettingsRequest {
  year: number;
}

export interface UpdateMainSegmentEditionRequest extends MainSegmentEditionSettingsRequest {}

export interface SetMainSegmentStatusRequest {
  status: MainSegmentEditionStatus;
}

export interface SetMainSegmentRegistrationRequest {
  availabilityOverride: boolean | null;
}

export interface MainSegmentProgramItemRequest {
  category: MainSegmentProgramCategory;
  title: string;
  description: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  isVisible: boolean;
  displayOrder?: number | null;
  personIds?: string[] | null;
}

export interface MainSegmentPersonRequest {
  name: string;
  jobTitle: string;
  shortBio: string;
  linkedInUrl?: string | null;
  displayOrder?: number | null;
  programItemIds?: string[] | null;
}

export interface MainSegmentOrganizationRequest {
  name: string;
  category: MainSegmentOrganizationCategory;
  websiteUrl?: string | null;
  sponsorTier?: SponsorshipTier | null;
  isVisible: boolean;
  displayOrder?: number | null;
}

export interface ReorderMainSegmentRequest {
  ids: string[];
}

export interface AssignMainSegmentPeopleRequest {
  programItemIds: string[];
}
