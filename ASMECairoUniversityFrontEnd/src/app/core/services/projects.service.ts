import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Project, ProjectSummary, ProjectType, ProjectStatus,
  EventProject, WorkshopProject, FieldTripProject, CompetitionProject,
} from '../models/project.model';

const CREATE_ENDPOINT: Record<ProjectType, string> = {
  [ProjectType.Event]: 'events',
  [ProjectType.Workshop]: 'workshops',
  [ProjectType.FieldTrip]: 'fieldtrips',
  [ProjectType.Competition]: 'competitions',
};

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private baseUrl = `${environment.apiUrl}/api/Projects`;

  constructor(private http: HttpClient) {}

  /** All projects, any type — used by the browse/search page. Note: this is the
   *  lightweight ProjectSummaryDTO shape, not full Project — call getById() for detail. */
  getAll(): Observable<ProjectSummary[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(map(list => list.map(r => this.mapSummary(r))));
  }

  getByType(type: ProjectType): Observable<ProjectSummary[]> {
    return this.http.get<any[]>(`${this.baseUrl}/type/${type}`).pipe(map(list => list.map(r => this.mapSummary(r))));
  }

  getById(id: string): Observable<Project> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(map(r => this.mapProject(r)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setStatus(id: string, status: ProjectStatus): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/status`, { status });
  }

  createProject(type: ProjectType, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${CREATE_ENDPOINT[type]}`, formData);
  }

  /** The API already returns absolute URLs (e.g. "https://localhost:7033/uploads/...").
   *  This only kicks in as a safety net if a relative path ever comes back instead. */
  private resolveImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
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
    const gallery = (raw.galleryImages ?? [])
      .slice()
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((g: any) => this.resolveImageUrl(g.imagePath));

    return {
      id: raw.projectId,
      status: raw.status,
      title: raw.title,
      shortDescription: raw.shortDescription,
      longDescription: raw.longDescription,
      coverImageUrl: this.resolveImageUrl(raw.coverImagePath),
      location: raw.location,
      mainDateAndTime: raw.mainDateAndTime,
      galleryImageUrls: gallery,
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
          speakers: raw.speakers ?? [],
          sponsors: raw.sponsors ?? [],
          partners: raw.partners ?? [],
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
            fullName: i.fullName,
            title: i.title,
            bio: i.bio,
            specialization: i.specialization,
            email: i.email,
            linkedInUrl: i.linkedInUrl,
            profileImagePath: this.resolveImageUrl(i.profileImagePath),
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
      case ProjectType.Competition: {
        const competition: CompetitionProject = {
          ...base,
          type: ProjectType.Competition,
          prize: raw.prize,
          prizeCurrency: raw.prizeCurrency,
          maxParticipantsPerTeam: raw.maxParticipantsPerTeam,
        };
        return competition;
      }
      default:
        throw new Error(`Unknown project type: ${raw.projectType}`);
    }
  }
}