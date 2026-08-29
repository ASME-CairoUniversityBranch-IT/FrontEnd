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
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
  MainSegmentSectionKey,
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

    // Some preview images live with the Angular app before an administrator
    // uploads the final public asset. Keep those paths on the frontend origin;
    // API-owned storage paths continue through the backend below.
    if (/^(?:\/)?(?:assets|images)\//i.test(cleanPath)) {
      return `/${cleanPath.replace(/^\/+/, '')}`;
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
      category: this.mapEnum(
        Object.values(MainSegmentProgramCategory),
        raw.category,
        MainSegmentProgramCategory.Talk
      ),
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
      category: this.mapEnum(
        Object.values(MainSegmentOrganizationCategory),
        raw.category,
        MainSegmentOrganizationCategory.Partner
      ),
      logoUrl: raw.logoUrl ? this.resolveImageUrl(raw.logoUrl) : null,
      websiteUrl: raw.websiteUrl ?? null,
      sponsorTier: raw.sponsorTier == null
        ? null
        : this.mapEnum(['Strategic', 'Gold', 'Silver', 'Bronze', 'Platinum'], raw.sponsorTier, 'Strategic'),
    };
  }

  private mapSection(raw: any): MainSegmentSection {
    return {
      sectionKey: this.mapEnum(
        Object.values(MainSegmentSectionKey),
        raw.sectionKey,
        MainSegmentSectionKey.PanelDiscussion
      ),
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

  /**
   * ASP.NET's default enum JSON representation is numeric, while newer API
   * deployments may opt into string enums. Accept both so the public page keeps
   * working during that rollout.
   */
  private mapEnum<T extends string>(values: readonly T[], raw: unknown, fallback: T): T {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
      return values[raw] ?? fallback;
    }

    return typeof raw === 'string' && values.includes(raw as T) ? (raw as T) : fallback;
  }
}
