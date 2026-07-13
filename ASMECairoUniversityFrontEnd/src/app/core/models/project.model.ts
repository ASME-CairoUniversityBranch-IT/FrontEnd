export enum ProjectType {
  Competition = 0,
  FieldTrip = 1,
  Event = 2,
  Workshop = 3
}

export enum ProjectStatus {
  Draft = 0,
  Published = 1,
  Closed = 2 // CONFIRM with backend — names are guesses
}

export enum PrizeCurrency {
  EGP = 0,
  USD = 1 // CONFIRM with backend
}

export enum SponsorshipTier {
  Strategic = 0,
  Gold = 1,
  Silver = 2,
  Bronze = 3,
  Platinum = 4,
}

export interface ProjectBase {
  id: string;
  type: ProjectType;
  status: ProjectStatus;
  title: string;
  shortDescription: string;
  longDescription: string;
  coverImageUrl: string;
  location: string;
  mainDateAndTime: string;
  galleryImageUrls: string[];
}

// Field names match the API's GET response exactly (confirmed from a real payload).
export interface Speaker { name: string; title: string; shortBio: string; }
export interface Partner { name: string; partnerType: string; isMainPartner: boolean; }
export interface Sponsor { name: string; sponsorshipTier: SponsorshipTier; }

export interface Instructor {
  fullName: string;
  title: string;
  bio: string;
  specialization: string;
  email: string;
  linkedInUrl?: string;
  profileImagePath?: string; // resolved to an absolute URL by ProjectsService
}

export interface ProjectSummary {
  id: string;
  title: string;
  shortDescription: string;
  coverImageUrl: string;
  type: ProjectType;
  status: ProjectStatus;
  mainDateAndTime: string;
}
export interface EventProject extends ProjectBase {
  type: ProjectType.Event;
  ticketPrice: number;
  scheduleNotes: string;
  comment: string;
  speakers: Speaker[];
  sponsors: Sponsor[];
  partners: Partner[];
}

export interface WorkshopProject extends ProjectBase {
  type: ProjectType.Workshop;
  startDate: string;
  endDate: string;
  numberOfSessions: number;
  instructors: Instructor[];
}

export interface FieldTripProject extends ProjectBase {
  type: ProjectType.FieldTrip;
  destinationName: string;
  departureTime: string;
  returnTime: string;
  meetingPoint: string;
  transportationDetails: string;
  capacity: number;
  price: number;
  registrationUrl: string;
  requirements: string;
  notes: string;
}

export interface CompetitionProject extends ProjectBase {
  type: ProjectType.Competition;
  prize: number;
  prizeCurrency: PrizeCurrency;
  maxParticipantsPerTeam: number;
}

export type Project = EventProject | WorkshopProject | FieldTripProject | CompetitionProject;