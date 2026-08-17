import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Project, ProjectSummary, ProjectType, ProjectStatus, GalleryImage,
  EventProject, WorkshopProject, FieldTripProject, SchoolVisitProject,
} from '../models/project.model';
import { projectApiTypeSegment } from '../utils/project-route.util';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private baseUrl = `${environment.apiUrl}/api/Projects`;
  private projectsRootUrl = `${environment.apiUrl}/api/projects`;

  constructor(private http: HttpClient) {}

  /** All projects, any type — used by the browse/search page. Note: this is the
   *  lightweight ProjectSummaryDTO shape, not full Project — call getById() for detail. */
/** ADMIN ONLY — every project regardless of status (Draft/Published/Closed).
 *  Public-facing pages must use getAllPublished() instead, or drafts will leak to visitors. */
getAll(): Observable<ProjectSummary[]> {
  return this.http.get<any[]>(this.baseUrl).pipe(map(list => list.map(r => this.mapSummary(r))));
}

/** GET /api/projects/published — published-only, for the public browse/search page. */
getAllPublished(): Observable<ProjectSummary[]> {
  return this.http.get<any[]>(`${this.baseUrl}/published`).pipe(map(list => list.map(r => this.mapSummary(r))));
}

  getByType(type: ProjectType): Observable<ProjectSummary[]> {
    return this.http.get<any[]>(`${this.baseUrl}/type/${type}`).pipe(map(list => list.map(r => this.mapSummary(r))));
  }

  getById(id: string): Observable<Project> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(map(r => this.mapProject(r)));
  }

  /** Cascades to all children, photos, and gallery images server-side. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setStatus(id: string, status: ProjectStatus): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/status`, { status });
  }

  /** POST /api/projects/{type} — every project type has its own create endpoint (handover §4),
   *  so this always resolves straight to e.g. `/api/projects/events`, never the shared
   *  `/api/Projects` route those other calls above use. */
  createProject(type: ProjectType, formData: FormData): Observable<any> {
    return this.http.post(`${this.projectsRootUrl}/${projectApiTypeSegment(type)}`, formData);
  }

  /** PUT /api/projects/{type}/{projectId} — same per-type routing as create. 404 if the project
   *  doesn't exist, 400 if `projectId` exists but is a different type than `type`. */
  updateProject(type: ProjectType, id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.projectsRootUrl}/${projectApiTypeSegment(type)}/${id}`, formData);
  }

  /** The API already returns absolute URLs (e.g. "https://localhost:7033/uploads/...").
   *  This only kicks in as a safety net if a relative path ever comes back instead. */
  private resolveImageUrl(path: string | null | undefined): string {
    if (!path) return '';

    const apiUrl = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.trim();

    // Already a full URL
    if (/^https?:\/\//i.test(cleanPath)) {
      return cleanPath;
    }

    // Fix URLs accidentally stored without protocol
    if (/^[a-z0-9.-]+\.[a-z]{2,}\/.+/i.test(cleanPath)) {
      return `https://${cleanPath}`;
    }

    return `${apiUrl}/${cleanPath.replace(/^\/+/, '')}`;
  }

  /** ProjectSummaryDTO uses "Type" (not "ProjectType" like the detail DTO) — different endpoint, different shape. */
  private mapSummary(raw: any): ProjectSummary {
    return {
      id: raw.projectId,
      title: raw.title,
      shortDescription: raw.shortDescription,
      coverImageUrl: this.resolveImageUrl(raw.coverImagePath),
      type: raw.type,
      status: raw.status,
      mainDateAndTime: raw.mainDateAndTime,
    };
  }

  private mapBase(raw: any) {
    const gallery: GalleryImage[] = (raw.galleryImages ?? [])
      .map((g: any) => ({ id: g.id, url: this.resolveImageUrl(g.imagePath), displayOrder: g.displayOrder ?? 0 }))
      .sort((a: GalleryImage, b: GalleryImage) => a.displayOrder - b.displayOrder);

    return {
      id: raw.projectId,
      status: raw.status,
      title: raw.title,
      shortDescription: raw.shortDescription,
      longDescription: raw.longDescription,
      coverImageUrl: this.resolveImageUrl(raw.coverImagePath),
      location: raw.location,
      mainDateAndTime: raw.mainDateAndTime,
      createdAt: raw.createdAt,
      galleryImages: gallery,
      galleryImageUrls: gallery.map(g => g.url),
    };
  }

  private mapProject(raw: any): Project {
    const base = this.mapBase(raw);

    switch (raw.projectType as ProjectType) {
      case ProjectType.Event: {
        const event: EventProject = {
          ...base,
          type: ProjectType.Event,
          ticketPrice: raw.ticketPrice,
          scheduleNotes: raw.scheduleNotes,
          comment: raw.comment,
          speakers: (raw.speakers ?? []).map((s: any) => ({
            id: s.id ?? null,
            name: s.name,
            title: s.title,
            shortBio: s.shortBio,
            photoUrl: this.resolveImageUrl(s.photoUrl) || null,
          })),
          sponsors: (raw.sponsors ?? []).map((s: any) => ({
            id: s.id ?? null,
            name: s.name,
            sponsorshipTier: s.sponsorshipTier,
            photoUrl: this.resolveImageUrl(s.photoUrl) || null,
          })),
          partners: (raw.partners ?? []).map((p: any) => ({
            id: p.id ?? null,
            name: p.name,
            partnerType: p.partnerType,
            isMainPartner: p.isMainPartner,
            photoUrl: this.resolveImageUrl(p.photoUrl) || null,
          })),
        };
        return event;
      }
      case ProjectType.Workshop: {
        const workshop: WorkshopProject = {
          ...base,
          type: ProjectType.Workshop,
          startDate: raw.startDate,
          endDate: raw.endDate,
          numberOfSessions: raw.numberOfSessions,
          instructors: (raw.instructors ?? []).map((i: any) => ({
            id: i.id ?? null,
            fullName: i.fullName,
            title: i.title,
            bio: i.bio,
            specialization: i.specialization,
            email: i.email,
            linkedInUrl: i.linkedInUrl,
            profileImagePath: this.resolveImageUrl(i.profileImagePath) || null,
          })),
        };
        return workshop;
      }
      case ProjectType.FieldTrip: {
        const fieldTrip: FieldTripProject = {
          ...base,
          type: ProjectType.FieldTrip,
          destinationName: raw.destinationName,
          departureTime: raw.departureTime,
          returnTime: raw.returnTime,
          meetingPoint: raw.meetingPoint,
          transportationDetails: raw.transportationDetails,
          capacity: raw.capacity,
          price: raw.price,
          registrationUrl: raw.registrationUrl,
          requirements: raw.requirements,
          notes: raw.notes,
        };
        return fieldTrip;
      }
      case ProjectType.SchoolVisit: {
        const schoolVisit: SchoolVisitProject = {
          ...base,
          type: ProjectType.SchoolVisit,
          schoolName: raw.schoolName,
          educationalStage: raw.educationalStage,
          numberOfStudents: raw.numberOfStudents ?? null,
          contactPersonName: raw.contactPersonName,
          contactPersonPhone: raw.contactPersonPhone,
          objective: raw.objective,
          requirements: raw.requirements,
          notes: raw.notes,
        };
        return schoolVisit;
      }
      default:
        throw new Error(`Unknown project type: ${raw.projectType}`);
    }
  }
}
