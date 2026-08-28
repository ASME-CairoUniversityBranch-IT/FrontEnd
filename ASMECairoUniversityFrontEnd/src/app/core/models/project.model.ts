export enum ProjectType {
  // Ordinal 0 per the API handover. CONFIRM against a real /api/projects payload before relying
  // on this — if the raw `type`/`projectType` numbers coming back don't line up with a project
  // you know is a school visit, this ordinal needs updating.
  SchoolVisit = 0,
  FieldTrip = 1,
  Event = 2,
  Workshop = 3
}

export enum ProjectStatus {
  Draft = 0,
  Published = 1,
  Closed = 2 // CONFIRM with backend — names are guesses
}

export enum SponsorshipTier {
  Strategic = 0,
  Gold = 1,
  Silver = 2,
  Bronze = 3,
  Platinum = 4,
}

/** A single gallery image as the API represents it — keeping `id` (not just the resolved URL)
 *  is required for the update flow, since `GalleryImageIdsToKeep` on PUT is a list of these ids. */
export interface GalleryImage {
  id: number;
  url: string;
  displayOrder: number;
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
  createdAt: string;
  /** Flattened, ordered URLs — what the public gallery display components consume. */
  galleryImageUrls: string[];
  /** Same images, with ids/order preserved — what the admin edit form consumes. */
  galleryImages: GalleryImage[];
}

// Field names match the API's GET response exactly (confirmed from a real payload).
// `id` is null for a brand-new entry that only exists client-side (not yet saved); the API
// assigns a real id once created, and that id must be echoed back on update to avoid duplicates.
export interface Speaker {
  id: string | null;
  name: string;
  title: string;
  shortBio: string;
  photoUrl?: string | null;
}
export interface Partner {
  id: string | null;
  name: string;
  partnerType: string;
  isMainPartner: boolean;
  photoUrl?: string | null;
}
export interface Sponsor {
  id: string | null;
  name: string;
  sponsorshipTier: SponsorshipTier;
  photoUrl?: string | null;
}

export interface Instructor {
  id: string | null;
  fullName: string;
  title: string;
  bio: string;
  specialization: string;
  email: string;
  linkedInUrl?: string | null;
  profileImagePath?: string | null; // resolved to an absolute URL by ProjectsService; read-only, see handover §5.2
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

/** See API handover §5.4. `educationalStage` is free text on the backend (not an enum); any
 *  fixed dropdown options are a frontend-only convention. */
export interface SchoolVisitProject extends ProjectBase {
  type: ProjectType.SchoolVisit;
  schoolName: string;
  educationalStage: string;
  numberOfStudents: number | null;
  contactPersonName: string;
  contactPersonPhone: string;
  objective: string;
  requirements: string;
  notes: string;
}

export type Project = EventProject | WorkshopProject | FieldTripProject | SchoolVisitProject;
