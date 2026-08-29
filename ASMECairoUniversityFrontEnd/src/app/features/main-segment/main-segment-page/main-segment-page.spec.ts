import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MainSegmentPageComponent } from './main-segment-page';
import { MainSegmentService } from '../../../core/services/main-segment.service';
import {
  MainSegmentEdition,
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

  const sampleEdition: MainSegmentEdition = {
    id: 'd9b1a774-8b65-4f3b-8b5e-4c8d19762101',
    year: 2026,
    slug: 'main-segment-2026',
    title: 'Main Segment 2026',
    heroContent: 'Engineering Horizons hero copy',
    heroImageUrl: 'https://example.com/hero.jpg',
    storyContent: 'The journey from insight to opportunity.',
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
        sectionKey: MainSegmentSectionKey.PanelDiscussion,
        displayOrder: 1,
        intro: 'Panel discussion intro',
        programItems: [],
        organizations: [],
      },
    ],
  };

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ year: '2026' }));
    mockMainSegmentService = {
      getByYear: vi.fn().mockReturnValue(of(sampleEdition)),
    };

    await TestBed.configureTestingModule({
      imports: [MainSegmentPageComponent],
      providers: [
        provideRouter([]),
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

  it('should load edition, render details, and update document title and meta description', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(mockMainSegmentService.getByYear).toHaveBeenCalledWith(2026);
    expect(compiled.querySelector('.ms-title')?.textContent).toContain('Main Segment 2026');
    expect(compiled.querySelector('.ms-year-badge')?.textContent).toContain('2026');
    expect(compiled.querySelector('.meta-badge.open')?.textContent).toContain('Open Now');

    expect(titleService.getTitle()).toBe('Main Segment 2026 | ASME Cairo University');
    const metaDesc = metaService.getTag('name="description"');
    expect(metaDesc?.content).toContain('Engineering Horizons hero copy');
  });

  it('should show not found view when backend returns 404', async () => {
    mockMainSegmentService.getByYear.mockReturnValue(throwError(() => ({ status: 404 })));
    paramMapSubject.next(convertToParamMap({ year: '2099' }));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-not-found')).toBeTruthy();
  });

  it('should show not found view for non-numeric year without calling API', async () => {
    mockMainSegmentService.getByYear.mockClear();
    paramMapSubject.next(convertToParamMap({ year: 'invalid-year' }));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMainSegmentService.getByYear).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-not-found')).toBeTruthy();
  });

  it('should show error view when backend fails with 500', async () => {
    mockMainSegmentService.getByYear.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );
    paramMapSubject.next(convertToParamMap({ year: '2026' }));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-card')).toBeTruthy();
    expect(compiled.querySelector('button.primary-btn')?.textContent).toContain('Try Again');
  });

  it('should reset title and meta tags when destroyed', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.destroy();

    expect(titleService.getTitle()).toBe('ASME Cairo University');
    const metaDesc = metaService.getTag('name="description"');
    expect(metaDesc?.content).toContain('ASME Cairo University Branch');
  });
});
