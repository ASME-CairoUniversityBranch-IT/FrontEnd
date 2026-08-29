import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateMainSegmentEditionRequest,
  MainSegmentAdminPersonResponse,
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
  MainSegmentOrganizationRequest,
  MainSegmentPersonRequest,
  MainSegmentProgramItemRequest,
  MainSegmentSectionRequest,
  UpdateMainSegmentEditionRequest,
} from '../models/main-segment.model';
import {
  AdminRegistrationSchemaResponse,
  DEFAULT_ADMIN_SCHEMA,
  UpdateRegistrationSchemaRequest,
} from '../models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class AdminMainSegmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/main-segments`;

  /* ── Edition-level Operations ── */
  getAdminEditions(): Observable<MainSegmentEditionSummary[]> {
    return this.http.get<MainSegmentEditionSummary[]>(this.baseUrl);
  }

  getAdminByYear(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .get<MainSegmentAdminResponse>(`${this.baseUrl}/${year}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  getPreview(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .get<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/preview`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  createEdition(request: CreateMainSegmentEditionRequest): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(this.baseUrl, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateEdition(
    year: number,
    request: UpdateMainSegmentEditionRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateSections(
    year: number,
    sections: MainSegmentSectionRequest[]
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/sections`, sections)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  setStatus(
    year: number,
    status: MainSegmentEditionStatus
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .patch<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/status`, { status })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  setRegistrationAvailability(
    year: number,
    availabilityOverride: boolean | null
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .patch<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration`, {
        availabilityOverride,
      })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  openRegistration(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration/open`, {})
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  closeRegistration(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration/close`, {})
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadHeroImage(year: number, file: File): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/hero-image`, formData)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteHeroImage(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/hero-image`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Program Items ── */
  createProgramItem(
    year: number,
    request: MainSegmentProgramItemRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/program-items`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateProgramItem(
    year: number,
    programItemId: string,
    request: MainSegmentProgramItemRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/program-items/${programItemId}`,
        request
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteProgramItem(
    year: number,
    programItemId: string
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/program-items/${programItemId}`
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderProgramItems(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/program-items/order`, { ids })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── People / Speakers ── */
  getPeople(year: number): Observable<MainSegmentAdminPersonResponse[]> {
    return this.http
      .get<MainSegmentAdminPersonResponse[]>(`${this.baseUrl}/${year}/people`)
      .pipe(
        map((people) =>
          people.map((p) => ({
            ...p,
            photoUrl: this.resolveImageUrl(p.photoUrl),
          }))
        )
      );
  }

  createPerson(
    year: number,
    request: MainSegmentPersonRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updatePerson(
    year: number,
    personId: string,
    request: MainSegmentPersonRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deletePerson(year: number, personId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderPeople(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/order`, { ids })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  assignPerson(
    year: number,
    personId: string,
    programItemIds: string[]
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/people/${personId}/assignments`,
        { programItemIds }
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadPersonPhoto(
    year: number,
    personId: string,
    file: File
  ): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/people/${personId}/photo`,
        formData
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deletePersonPhoto(year: number, personId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}/photo`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Organizations ── */
  createOrganization(
    year: number,
    request: MainSegmentOrganizationRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/organizations`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateOrganization(
    year: number,
    organizationId: string,
    request: MainSegmentOrganizationRequest
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}`,
        request
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteOrganization(
    year: number,
    organizationId: string
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}`
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderOrganizations(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/organizations/order`, { ids })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadOrganizationLogo(
    year: number,
    organizationId: string,
    file: File
  ): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}/logo`,
        formData
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteOrganizationLogo(
    year: number,
    organizationId: string
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}/logo`
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Registration Form & Question Builder Schema ── */
  getRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http
      .get<AdminRegistrationSchemaResponse>(`${this.baseUrl}/${year}/schema`)
      .pipe(catchError(() => of(DEFAULT_ADMIN_SCHEMA)));
  }

  updateRegistrationSchema(
    year: number,
    request: UpdateRegistrationSchemaRequest
  ): Observable<AdminRegistrationSchemaResponse> {
    return this.http.put<AdminRegistrationSchemaResponse>(
      `${this.baseUrl}/${year}/schema`,
      request
    );
  }

  publishRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http.post<AdminRegistrationSchemaResponse>(
      `${this.baseUrl}/${year}/schema/publish`,
      {}
    );
  }

  seedDefaultRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http
      .post<AdminRegistrationSchemaResponse>(
        `${this.baseUrl}/${year}/schema/seed-defaults`,
        {}
      )
      .pipe(catchError(() => of(DEFAULT_ADMIN_SCHEMA)));
  }

  /* ── Helper Normalization ── */
  private normalizeAdminResponse(res: MainSegmentAdminResponse): MainSegmentAdminResponse {
    if (!res) return res;
    return {
      ...res,
      heroImageUrl: this.resolveImageUrl(res.heroImageUrl),
      people: (res.people || []).map((p) => ({
        ...p,
        photoUrl: this.resolveImageUrl(p.photoUrl),
      })),
      organizations: (res.organizations || []).map((o) => ({
        ...o,
        logoUrl: this.resolveImageUrl(o.logoUrl),
      })),
    };
  }

  private resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendOrigin}${cleanPath}`;
  }
}
