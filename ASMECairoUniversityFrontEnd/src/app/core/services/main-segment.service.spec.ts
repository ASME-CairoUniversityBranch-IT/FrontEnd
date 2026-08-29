import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MainSegmentService } from './main-segment.service';
import { environment } from '../../../environments/environment';
import {
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
  MainSegmentSectionKey,
} from '../models/main-segment.model';

describe('MainSegmentService', () => {
  let service: MainSegmentService;
  let httpTestingController: HttpTestingController;
  const baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/main-segments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MainSegmentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MainSegmentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch current published edition and map properties correctly', () => {
    const mockRaw = {
      id: 'd9b1a774-8b65-4f3b-8b5e-4c8d19762101',
      year: 2026,
      slug: 'main-segment-2026',
      title: 'Main Segment 2026: Engineering Horizons',
      heroContent: 'Shape your future with industry leaders.',
      heroImageUrl: 'uploads/hero.jpg',
      storyContent: 'The premiere mechanical engineering event at Cairo University.',
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T18:00:00Z',
      location: 'Faculty of Engineering, Cairo University',
      registration: {
        isAvailable: true,
        opensAt: '2026-09-01T00:00:00Z',
        closesAt: '2026-10-10T23:59:59Z',
        capacity: 400,
      },
      sections: [
        {
          sectionKey: 'PanelDiscussion',
          displayOrder: 1,
          intro: 'Industry leaders discussing future trends',
          programItems: [
            {
              id: 'p1',
              category: 'PanelDiscussion',
              title: 'Future of Robotics',
              description: 'Panel on automation',
              startsAt: '2026-10-15T10:00:00Z',
              endsAt: '2026-10-15T11:30:00Z',
              location: 'Main Hall',
              people: [
                {
                  id: 'per1',
                  name: 'Dr. Jane Smith',
                  jobTitle: 'Head of Robotics',
                  shortBio: 'Leading robotics researcher',
                  photoUrl: 'https://example.com/jane.jpg',
                  linkedInUrl: 'https://linkedin.com/in/janesmith',
                },
              ],
            },
          ],
          organizations: [],
        },
        {
          sectionKey: 'Sponsors',
          displayOrder: 2,
          intro: 'Our valued sponsors',
          programItems: [],
          organizations: [
            {
              id: 'org1',
              name: 'Tech Corp',
              category: 'Sponsor',
              logoUrl: 'uploads/techcorp.png',
              websiteUrl: 'https://techcorp.com',
              sponsorTier: 'Platinum',
            },
          ],
        },
      ],
    };

    service.getCurrentEdition().subscribe((edition) => {
      expect(edition.year).toBe(2026);
      expect(edition.slug).toBe('main-segment-2026');
      expect(edition.title).toBe('Main Segment 2026: Engineering Horizons');
      expect(edition.heroImageUrl).toBe(`${environment.apiUrl.replace(/\/+$/, '')}/uploads/hero.jpg`);
      expect(edition.registration.isAvailable).toBe(true);
      expect(edition.sections.length).toBe(2);
      expect(edition.sections[0].sectionKey).toBe(MainSegmentSectionKey.PanelDiscussion);
      expect(edition.sections[0].programItems[0].people[0].name).toBe('Dr. Jane Smith');
      expect(edition.sections[1].organizations[0].name).toBe('Tech Corp');
    });

    const req = httpTestingController.expectOne(`${baseUrl}/current`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRaw);
  });

  it('should fetch edition by year', () => {
    const mockRaw = {
      id: 'd9b1a774-8b65-4f3b-8b5e-4c8d19762101',
      year: 2026,
      slug: 'main-segment-2026',
      title: 'Main Segment 2026',
      heroContent: 'Hero copy',
      storyContent: 'Story copy',
      startsAt: '2026-10-15T09:00:00Z',
      endsAt: '2026-10-15T18:00:00Z',
      location: 'Cairo University',
      registration: { isAvailable: false },
      sections: [],
    };

    service.getByYear(2026).subscribe((edition) => {
      expect(edition.year).toBe(2026);
      expect(edition.title).toBe('Main Segment 2026');
    });

    const req = httpTestingController.expectOne(`${baseUrl}/2026`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRaw);
  });

  it('should resolve image URLs properly', () => {
    const full = 'https://cdn.example.com/photo.jpg';
    expect(service.resolveImageUrl(full)).toBe(full);

    const relative = 'uploads/logo.png';
    expect(service.resolveImageUrl(relative)).toBe(
      `${environment.apiUrl.replace(/\/+$/, '')}/uploads/logo.png`
    );

    expect(service.resolveImageUrl('images/main-segment/logo-eui.svg')).toBe(
      '/images/main-segment/logo-eui.svg'
    );
    expect(service.resolveImageUrl('/assets/main-segment/speaker.svg')).toBe(
      '/assets/main-segment/speaker.svg'
    );

    expect(service.resolveImageUrl(null)).toBe('');
    expect(service.resolveImageUrl(undefined)).toBe('');
  });
});
