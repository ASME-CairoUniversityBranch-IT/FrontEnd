import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MainSegmentPageComponent } from './main-segment-page';
import { MainSegmentService } from '../../../core/services/main-segment.service';
import {
  MainSegmentEdition,
  MainSegmentOrganizationCategory,
  MainSegmentProgramCategory,
  MainSegmentSectionKey,
} from '../../../core/models/main-segment.model';

describe('MainSegmentPageComponent', () => {
  let component: MainSegmentPageComponent;
  let fixture: ComponentFixture<MainSegmentPageComponent>;
  let titleService: Title;
  let metaService: Meta;
  let mockMainSegmentService: {
    getByYear: ReturnType<typeof vi.fn>;
  };
  let paramMapSubject: BehaviorSubject<any>;

  const fullSampleEdition: MainSegmentEdition = {
    id: 'd9b1a774-8b65-4f3b-8b5e-4c8d19762101',
    year: 2026,
    slug: 'main-segment-2026',
    title: 'Main Segment 2026: Engineering Horizons',
    heroContent: 'Shape your future with engineering leaders.',
    heroImageUrl: 'https://example.com/hero.jpg',
    storyContent: 'The premiere mechanical engineering gathering at Cairo University.',
    startsAt: '2026-10-15T09:00:00Z',
    endsAt: '2026-10-15T18:00:00Z',
    location: 'Faculty of Engineering, Cairo University',
    registration: {
      isAvailable: true,
      opensAt: '2026-09-01T00:00:00Z',
      closesAt: '2026-10-10T23:59:59Z',
      capacity: 500,
    },
    sections: [
      {
        sectionKey: MainSegmentSectionKey.PanelDiscussion,
        displayOrder: 1,
        intro: 'Perspective from industry leaders',
        programItems: [
          {
            id: 'p1',
            category: MainSegmentProgramCategory.PanelDiscussion,
            title: 'Future of Automation',
            description: 'Panel on advanced robotics and automation systems.',
            startsAt: '2026-10-15T10:00:00Z',
            endsAt: '2026-10-15T11:30:00Z',
            location: 'Main Auditorium',
            people: [
              {
                id: 'sp1',
                name: 'Dr. Jane Smith',
                jobTitle: 'Head of Robotics Research',
                shortBio: 'Pioneer in robotic design.',
                photoUrl: 'https://example.com/jane.jpg',
                linkedInUrl: 'https://linkedin.com/in/janesmith',
              },
              {
                id: 'sp2',
                name: 'Eng. Omar Tarek',
                jobTitle: 'Automation Lead at TechCorp',
                shortBio: '',
                photoUrl: null, // tests fallback initials
                linkedInUrl: null,
              },
            ],
          },
        ],
        organizations: [],
      },
      {
        sectionKey: MainSegmentSectionKey.CareerFair,
        displayOrder: 2,
        intro: 'Meet recruitment teams from top engineering companies.',
        programItems: [],
        organizations: [
          {
            id: 'org1',
            name: 'ABB Robotics',
            category: MainSegmentOrganizationCategory.CareerFair,
            logoUrl: 'https://example.com/abb.png',
            websiteUrl: 'https://abb.com',
            sponsorTier: null,
          },
          {
            id: 'org2',
            name: 'Siemens Energy',
            category: MainSegmentOrganizationCategory.CareerFair,
            logoUrl: null, // tests fallback initials
            websiteUrl: 'https://siemens.com',
            sponsorTier: null,
          },
        ],
      },
      {
        sectionKey: MainSegmentSectionKey.Sponsors,
        displayOrder: 3,
        intro: 'Our generous innovation partners.',
        programItems: [],
        organizations: [
          {
            id: 'sp-org1',
            name: 'National Steel',
            category: MainSegmentOrganizationCategory.Sponsor,
            logoUrl: 'https://example.com/steel.png',
            websiteUrl: 'https://steel.com',
            sponsorTier: 'Gold',
          },
          {
            id: 'sp-org2',
            name: 'Apex Innovations',
            category: MainSegmentOrganizationCategory.Sponsor,
            logoUrl: 'https://example.com/apex.png',
            websiteUrl: 'https://apex.com',
            sponsorTier: 'Strategic',
          },
        ],
      },
      {
        sectionKey: MainSegmentSectionKey.Partners,
        displayOrder: 4,
        intro: 'Academic & community collaboration partners.',
        programItems: [],
        organizations: [
          {
            id: 'pt1',
            name: 'Cairo University Alumni Association',
            category: MainSegmentOrganizationCategory.Partner,
            logoUrl: 'https://example.com/alumni.png',
            websiteUrl: 'https://alumni.cu.edu.eg',
            sponsorTier: null,
          },
        ],
      },
      {
        sectionKey: MainSegmentSectionKey.Talks,
        displayOrder: 5,
        intro: null,
        programItems: [], // empty section - should be omitted cleanly
        organizations: [],
      },
    ],
  };

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ year: '2026' }));
    mockMainSegmentService = {
      getByYear: vi.fn().mockReturnValue(of(fullSampleEdition)),
    };

    await TestBed.configureTestingModule({
      imports: [MainSegmentPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MainSegmentService, useValue: mockMainSegmentService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    fixture = TestBed.createComponent(MainSegmentPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load full storytelling edition and set title & meta tags', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(mockMainSegmentService.getByYear).toHaveBeenCalledWith(2026);
    expect(compiled.querySelector('.ms-title')?.textContent).toContain(
      'Main Segment 2026: Engineering Horizons'
    );
    expect(titleService.getTitle()).toBe(
      'Main Segment 2026: Engineering Horizons | ASME Cairo University'
    );
    expect(metaService.getTag('name="description"')?.content).toContain(
      'Shape your future with engineering leaders.'
    );
  });

  it('should render all 9 story elements accurately', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // 1. Hero Section
    expect(compiled.querySelector('.ms-hero')).toBeTruthy();
    expect(compiled.querySelector('.ms-visual-img')).toBeTruthy();
    expect(compiled.querySelector('.meta-badge.open')?.textContent).toContain('Open Now');

    // 2. Why Main Segment Matters Story
    expect(compiled.querySelector('.ms-story-section')).toBeTruthy();
    expect(compiled.querySelector('.ms-story-paragraph')?.textContent).toContain(
      'The premiere mechanical engineering gathering'
    );
    expect(compiled.querySelector('.ms-story-heading h2')?.textContent).toContain(
      'A career in motion.'
    );
    expect(compiled.querySelectorAll('.story-stop').length).toBe(4);

    // 3. Experience Journey Roadmap (6 steps)
    const journeyCards = compiled.querySelectorAll('.ms-journey-card');
    expect(journeyCards.length).toBe(6);
    expect(journeyCards[0].textContent).toContain('Panel Discussions');
    expect(journeyCards[4].textContent).toContain('Career Fair');

    // 4. Panel Discussion with Speakers
    const panelSection = compiled.querySelector('#section-PanelDiscussion');
    expect(panelSection).toBeTruthy();
    expect(panelSection?.textContent).toContain('Future of Automation');
    const speakerCards = panelSection?.querySelectorAll('.person-card');
    expect(speakerCards?.length).toBe(2);
    expect(speakerCards?.[0].textContent).toContain('Dr. Jane Smith');
    expect(speakerCards?.[1].querySelector('.person-photo')?.getAttribute('src')).toContain(
      '/images/main-segment/speaker-portrait-'
    );

    // 5. Career Fair with equal stages & fallbacks
    const careerFairSection = compiled.querySelector('#section-CareerFair');
    expect(careerFairSection).toBeTruthy();
    const orgCards = careerFairSection?.querySelectorAll('.ms-org-card');
    expect(orgCards?.length).toBe(2);
    expect(orgCards?.[0].textContent).toContain('ABB Robotics');
    expect(orgCards?.[1].querySelector('.org-logo')?.getAttribute('src')).toContain(
      '/images/main-segment/logo-generic.svg'
    );

    // 7. Sponsors with explicit tier hierarchy (Strategic before Gold)
    const sponsorsSection = compiled.querySelector('#section-Sponsors');
    expect(sponsorsSection).toBeTruthy();
    const tierGroups = sponsorsSection?.querySelectorAll('.ms-sponsor-tier-group');
    expect(tierGroups?.length).toBe(2);
    expect(tierGroups?.[0].querySelector('.sponsor-tier-title')?.textContent?.trim()).toBe('Strategic');
    expect(tierGroups?.[1].querySelector('.sponsor-tier-title')?.textContent?.trim()).toBe('Gold');

    // 8. Partners section
    const partnersSection = compiled.querySelector('#section-Partners');
    expect(partnersSection).toBeTruthy();
    expect(partnersSection?.textContent).toContain('Cairo University Alumni Association');

    // Clean omission of empty Talks section
    expect(compiled.querySelector('#section-Talks')).toBeNull();

    // 9. Final Registration Section
    const regSection = compiled.querySelector('#registration');
    expect(regSection).toBeTruthy();
    expect(regSection?.querySelector('.reg-btn-primary')).toBeTruthy();
    expect(regSection?.textContent).toContain('500 Available Seats');
  });

  it('should render scheduled registration status when registration opens in the future', async () => {
    const futureEdition: MainSegmentEdition = {
      ...fullSampleEdition,
      registration: {
        isAvailable: false,
        opensAt: new Date(Date.now() + 86400000).toISOString(),
        closesAt: null,
      },
    };
    mockMainSegmentService.getByYear.mockReturnValue(of(futureEdition));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.reg-status-pill.scheduled')?.textContent).toContain(
      'Registration Opening Soon'
    );
    expect(compiled.querySelector('.reg-btn-disabled')?.textContent).toContain('Registration Opens on');
  });

  it('should render closed registration status when registration is closed', async () => {
    const closedEdition: MainSegmentEdition = {
      ...fullSampleEdition,
      registration: {
        isAvailable: false,
        opensAt: '2026-08-01T00:00:00Z',
        closesAt: '2026-08-15T00:00:00Z',
      },
    };
    mockMainSegmentService.getByYear.mockReturnValue(of(closedEdition));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.reg-status-pill')?.textContent).toContain('Registration Closed');
    expect(compiled.querySelector('.reg-btn-disabled')?.textContent).toContain('Registration is Currently Closed');
  });

  it('should show not found view when edition is not found (404)', async () => {
    mockMainSegmentService.getByYear.mockReturnValue(throwError(() => ({ status: 404 })));
    paramMapSubject.next(convertToParamMap({ year: '2099' }));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-not-found')).toBeTruthy();
    expect(titleService.getTitle()).toContain('Edition Not Found');
  });

  it('should reset title and meta tags on destroy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.destroy();

    expect(titleService.getTitle()).toBe('ASME Cairo University');
    expect(metaService.getTag('name="description"')?.content).toContain(
      'ASME Cairo University Branch'
    );
  });
});
