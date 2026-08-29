import {
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
  MainSegmentSectionKey,
} from '../models/main-segment.model';
import {
  getOrgInitials,
  getPersonInitials,
  getSectionDisplayTitle,
  getSectionEyebrow,
  groupSponsorsByTier,
  hasSectionContent,
  toInputDateTime,
  toIsoDateTime,
} from './main-segment.util';

describe('main-segment.util', () => {
  it('should generate initials correctly for people', () => {
    expect(getPersonInitials('Jane Smith')).toBe('JS');
    expect(getPersonInitials('Ahmed Mohamed Ali')).toBe('AA');
    expect(getPersonInitials('Single')).toBe('SI');
    expect(getPersonInitials('')).toBe('SP');
  });

  it('should generate initials correctly for organizations', () => {
    expect(getOrgInitials('General Electric')).toBe('GE');
    expect(getOrgInitials('Tesla')).toBe('TE');
    expect(getOrgInitials('')).toBe('ORG');
  });

  it('should group sponsors by explicit tier order (Strategic -> Platinum -> Gold -> Silver -> Bronze)', () => {
    const sponsors = [
      {
        id: '1',
        name: 'Silver Sponsor LLC',
        category: MainSegmentOrganizationCategory.Sponsor,
        sponsorTier: 'Silver',
      },
      {
        id: '2',
        name: 'Strategic Sponsor Inc',
        category: MainSegmentOrganizationCategory.Sponsor,
        sponsorTier: 'Strategic',
      },
      {
        id: '3',
        name: 'Platinum Corp',
        category: MainSegmentOrganizationCategory.Sponsor,
        sponsorTier: 'Platinum',
      },
      {
        id: '4',
        name: 'Gold Enterprise',
        category: MainSegmentOrganizationCategory.Sponsor,
        sponsorTier: 'Gold',
      },
    ];

    const groups = groupSponsorsByTier(sponsors);
    expect(groups.length).toBe(4);
    expect(groups[0].tierName).toBe('Strategic');
    expect(groups[1].tierName).toBe('Platinum');
    expect(groups[2].tierName).toBe('Gold');
    expect(groups[3].tierName).toBe('Silver');
  });

  it('should verify whether a section has publishable content', () => {
    expect(
      hasSectionContent({
        sectionKey: MainSegmentSectionKey.Talks,
        displayOrder: 1,
        programItems: [],
        organizations: [],
      })
    ).toBe(false);

    expect(
      hasSectionContent({
        sectionKey: MainSegmentSectionKey.Talks,
        displayOrder: 1,
        intro: 'Intro text',
        programItems: [],
        organizations: [],
      })
    ).toBe(true);

    expect(
      hasSectionContent({
        sectionKey: MainSegmentSectionKey.Talks,
        displayOrder: 1,
        programItems: [
          {
            id: 't1',
            category: MainSegmentProgramCategory.Talk,
            title: 'Sample Talk',
            description: 'Desc',
            people: [],
          },
        ],
        organizations: [],
      })
    ).toBe(true);
  });

  it('should return human-readable section titles and eyebrows', () => {
    expect(getSectionDisplayTitle(MainSegmentSectionKey.PanelDiscussion)).toBe('Panel Discussions');
    expect(getSectionEyebrow(MainSegmentSectionKey.PanelDiscussion)).toBe('Perspective');
    expect(getSectionDisplayTitle(MainSegmentSectionKey.CvReviewAndMockInterviews)).toBe(
      'CV Review & Mock Interviews'
    );
  });
});

  it('should convert ISO strings to input datetime and back to ISO', () => {
    const iso = '2026-10-15T09:00:00.000Z';
    const local = toInputDateTime(iso);
    expect(local).toBeTruthy();
    expect(local.includes('T')).toBe(true);

    const backToIso = toIsoDateTime(local);
    expect(backToIso).toBeTruthy();
    expect(toInputDateTime(null)).toBe('');
    expect(toIsoDateTime('')).toBeNull();
  });
