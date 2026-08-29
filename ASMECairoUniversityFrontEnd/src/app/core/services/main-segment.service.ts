import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MainSegmentEdition,
  MainSegmentSection,
  MainSegmentProgramItem,
  MainSegmentPerson,
  MainSegmentOrganization,
} from '../models/main-segment.model';

@Injectable({ providedIn: 'root' })
export class MainSegmentService {
  private readonly baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/main-segments`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the latest published Main Segment edition.
   */
  getCurrentEdition(): Observable<MainSegmentEdition> {
    return this.http
      .get<any>(`${this.baseUrl}/current`)
      .pipe(map((raw) => this.mapEdition(raw)));
  }

  /**
   * Fetches a specific published Main Segment edition by year.
   */
  getByYear(year: number): Observable<MainSegmentEdition> {
    return this.http
      .get<any>(`${this.baseUrl}/${year}`)
      .pipe(map((raw) => this.mapEdition(raw)));
  }

  /**
   * Resolves relative or incomplete image URLs against API environment base URL.
   */
  resolveImageUrl(path: string | null | undefined): string {
    if (!path) return '';

    const apiUrl = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.trim();

    if (/^https?:\/\//i.test(cleanPath)) {
      return cleanPath;
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}\/.+/i.test(cleanPath)) {
      return `https://${cleanPath}`;
    }

    return `${apiUrl}/${cleanPath.replace(/^\/+/, '')}`;
  }

  private mapPerson(raw: any): MainSegmentPerson {
    return {
      id: raw.id,
      name: raw.name ?? '',
      jobTitle: raw.jobTitle ?? '',
      shortBio: raw.shortBio ?? '',
      photoUrl: raw.photoUrl ? this.resolveImageUrl(raw.photoUrl) : null,
      linkedInUrl: raw.linkedInUrl ?? null,
    };
  }

  private mapProgramItem(raw: any): MainSegmentProgramItem {
    return {
      id: raw.id,
      category: raw.category,
      title: raw.title ?? '',
      description: raw.description ?? '',
      startsAt: raw.startsAt ?? null,
      endsAt: raw.endsAt ?? null,
      location: raw.location ?? null,
      people: (raw.people ?? []).map((p: any) => this.mapPerson(p)),
    };
  }

  private mapOrganization(raw: any): MainSegmentOrganization {
    return {
      id: raw.id,
      name: raw.name ?? '',
      category: raw.category,
      logoUrl: raw.logoUrl ? this.resolveImageUrl(raw.logoUrl) : null,
      websiteUrl: raw.websiteUrl ?? null,
      sponsorTier: raw.sponsorTier ?? null,
    };
  }

  private mapSection(raw: any): MainSegmentSection {
    return {
      sectionKey: raw.sectionKey,
      displayOrder: raw.displayOrder ?? 0,
      intro: raw.intro ?? null,
      programItems: (raw.programItems ?? []).map((p: any) => this.mapProgramItem(p)),
      organizations: (raw.organizations ?? []).map((o: any) => this.mapOrganization(o)),
    };
  }

  private mapEdition(raw: any): MainSegmentEdition {
    return {
      id: raw.id,
      year: raw.year,
      slug: raw.slug ?? '',
      title: raw.title ?? '',
      heroContent: raw.heroContent ?? '',
      heroImageUrl: raw.heroImageUrl ? this.resolveImageUrl(raw.heroImageUrl) : null,
      storyContent: raw.storyContent ?? '',
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      location: raw.location ?? '',
      registration: {
        isAvailable: Boolean(raw.registration?.isAvailable),
        opensAt: raw.registration?.opensAt ?? null,
        closesAt: raw.registration?.closesAt ?? null,
        capacity: raw.registration?.capacity ?? null,
      },
      sections: (raw.sections ?? [])
        .map((s: any) => this.mapSection(s))
        .sort((a: MainSegmentSection, b: MainSegmentSection) => a.displayOrder - b.displayOrder),
    };
  }
}
