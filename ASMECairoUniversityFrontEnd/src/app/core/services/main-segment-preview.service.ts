import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { AdminMainSegmentService } from './admin-main-segment.service';
import {
  MainSegmentAdminResponse,
  MainSegmentEdition,
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
  MainSegmentSectionKey,
} from '../models/main-segment.model';

const programSections: Record<MainSegmentProgramCategory, MainSegmentSectionKey> = {
  PanelDiscussion: MainSegmentSectionKey.PanelDiscussion,
  Talk: MainSegmentSectionKey.Talks,
  Workshop: MainSegmentSectionKey.Workshops,
  MentorshipCircle: MainSegmentSectionKey.MentorshipCircles,
};
const organizationSections: Record<MainSegmentOrganizationCategory, MainSegmentSectionKey> = {
  CareerFair: MainSegmentSectionKey.CareerFair,
  CvReviewAndMockInterview: MainSegmentSectionKey.CvReviewAndMockInterviews,
  Sponsor: MainSegmentSectionKey.Sponsors,
  Partner: MainSegmentSectionKey.Partners,
};

/** Scoped to the authenticated preview: public pages never request admin content. */
@Injectable()
export class MainSegmentPreviewService {
  private readonly adminService = inject(AdminMainSegmentService);

  getByYear(year: number) {
    return this.adminService.getPreview(year).pipe(map(toPreviewEdition));
  }
}

/** The admin response is already ordered and its media URLs normalized by the service. */
export function toPreviewEdition(edition: MainSegmentAdminResponse): MainSegmentEdition {
  return {
    id: edition.id,
    year: edition.year,
    slug: edition.slug,
    title: edition.title,
    heroContent: edition.heroContent,
    heroImageUrl: edition.heroImageUrl,
    storyContent: edition.storyContent,
    startsAt: edition.startsAt,
    endsAt: edition.endsAt,
    location: edition.location,
    registration: {
      isAvailable: edition.isRegistrationAvailable,
      opensAt: edition.registrationOpensAt,
      closesAt: edition.registrationClosesAt,
      capacity: edition.capacity,
    },
    sections: edition.sections
      .filter(section => section.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(section => ({
        sectionKey: section.sectionKey,
        displayOrder: section.displayOrder,
        intro: section.sectionKey === MainSegmentSectionKey.CareerFair
          ? edition.careerFairIntro
          : section.sectionKey === MainSegmentSectionKey.CvReviewAndMockInterviews
            ? edition.cvReviewAndMockInterviewsIntro : null,
        programItems: edition.programItems
          .filter(item => item.isVisible && programSections[item.category] === section.sectionKey)
          .map(item => ({
            ...item,
            people: edition.people.filter(person => item.personIds.includes(person.id)),
          })),
        organizations: edition.organizations.filter(
          organization => organization.isVisible && organizationSections[organization.category] === section.sectionKey,
        ),
      }))
      // Match the public API: intro copy alone does not make an empty section visible.
      .filter(section => section.programItems.length > 0 || section.organizations.length > 0),
  };
}
