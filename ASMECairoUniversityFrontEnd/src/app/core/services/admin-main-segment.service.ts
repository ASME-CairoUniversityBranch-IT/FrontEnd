import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateMainSegmentEditionRequest,
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
  MainSegmentSectionRequest,
  UpdateMainSegmentEditionRequest,
} from '../models/main-segment.model';

@Injectable({
  providedIn: 'root',
})
export class AdminMainSegmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/main-segments`;

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
