import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { AdminMainSegmentPreviewComponent } from './admin-main-segment-preview';
import { MainSegmentPageComponent } from '../../../main-segment/main-segment-page/main-segment-page';
import { MainSegmentAdminResponse, MainSegmentEditionStatus, MainSegmentOrganizationCategory, MainSegmentProgramCategory, MainSegmentSectionKey } from '../../../../core/models/main-segment.model';
import { environment } from '../../../../../environments/environment';
import { routes } from '../../../../app.routes';
import { authGuard } from '../../../../core/guards/auth.guard';

describe('AdminMainSegmentPreviewComponent', () => {
  let fixture: ComponentFixture<AdminMainSegmentPreviewComponent>;
  let http: HttpTestingController;
  const endpoint = `${environment.apiUrl.replace(/\/+$/, '')}/api/admin/main-segments/2026/preview`;
  const edition: MainSegmentAdminResponse = {
    id: 'edition', year: 2026, slug: 'main-segment-2026', title: 'Saved draft edition',
    heroContent: 'Saved hero copy', heroImageUrl: '/uploads/hero.jpg', storyContent: 'Saved story copy',
    startsAt: '2026-11-06T09:00:00Z', endsAt: '2026-11-06T18:00:00Z', location: 'Cairo',
    status: MainSegmentEditionStatus.Draft, isRegistrationAvailable: false,
    careerFairIntro: 'Meet hiring teams', cvReviewAndMockInterviewsIntro: 'Review your CV',
    sections: [
      { id: 'career', sectionKey: MainSegmentSectionKey.CareerFair, displayOrder: 2, isVisible: true },
      { id: 'talks', sectionKey: MainSegmentSectionKey.Talks, displayOrder: 0, isVisible: true },
      { id: 'hidden', sectionKey: MainSegmentSectionKey.Partners, displayOrder: 1, isVisible: false },
      { id: 'empty', sectionKey: MainSegmentSectionKey.CvReviewAndMockInterviews, displayOrder: 3, isVisible: true },
    ],
    programItems: [
      { id: 'talk', category: MainSegmentProgramCategory.Talk, title: 'Visible talk', description: 'Talk copy', displayOrder: 0, isVisible: true, personIds: ['speaker'] },
      { id: 'hidden-talk', category: MainSegmentProgramCategory.Talk, title: 'Hidden talk', description: 'Hidden copy', displayOrder: 1, isVisible: false, personIds: [] },
    ],
    people: [
      { id: 'speaker', name: 'Speaker Name', jobTitle: 'Engineer', shortBio: 'Speaker bio', photoUrl: '/uploads/speaker.jpg', displayOrder: 0, programItemIds: ['talk'] },
      { id: 'unassigned', name: 'Unassigned speaker', jobTitle: 'Engineer', shortBio: '', displayOrder: 1, programItemIds: [] },
    ],
    organizations: [
      { id: 'company', name: 'Visible company', category: MainSegmentOrganizationCategory.CareerFair, logoUrl: '/uploads/company.png', isVisible: true, displayOrder: 0 },
      { id: 'hidden-company', name: 'Hidden company', category: MainSegmentOrganizationCategory.CareerFair, isVisible: false, displayOrder: 1 },
      { id: 'partner', name: 'Hidden section partner', category: MainSegmentOrganizationCategory.Partner, isVisible: true, displayOrder: 0 },
    ],
  };

  beforeEach(async () => {
    const params = convertToParamMap({ year: '2026' });
    await TestBed.configureTestingModule({
      imports: [AdminMainSegmentPreviewComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(params), snapshot: { paramMap: params } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminMainSegmentPreviewComponent);
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); fixture.destroy(); });

  async function load(response = edition) {
    http.expectOne(endpoint).flush(response);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders saved drafts using the real page and authenticated preview endpoint', async () => {
    const el = await load();
    expect(el.querySelector('.ms-title')?.textContent).toContain('Saved draft edition');
    expect(el.textContent).toContain('Saved-page preview');
    expect(el.textContent).toContain('Saved story copy');
    expect(el.querySelector('.ms-visual-img')?.getAttribute('src')).toBe(`${environment.apiUrl}/uploads/hero.jpg`);
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/admin/main-segment/2026');
    http.expectNone(`${environment.apiUrl}/api/main-segments/2026`);
  });

  it('matches public visibility and includes assigned speakers, media, and company introductions', async () => {
    const el = await load();
    expect(el.textContent).toContain('Visible talk');
    expect(el.textContent).toContain('Speaker Name');
    expect(el.textContent).toContain('Engineer');
    expect(el.textContent).toContain('Visible company');
    expect(el.textContent).toContain('Meet hiring teams');
    for (const hidden of ['Hidden talk', 'Hidden company', 'Hidden section partner', 'Unassigned speaker', 'Review your CV']) {
      expect(el.textContent).not.toContain(hidden);
    }
    expect(el.querySelector('img[alt="Speaker Name - Engineer"]')?.getAttribute('src')).toBe(`${environment.apiUrl}/uploads/speaker.jpg`);
    expect(el.querySelector('img[alt="Visible company logo"]')?.getAttribute('src')).toBe(`${environment.apiUrl}/uploads/company.png`);
    const sections = [...el.querySelectorAll('[id^="section-"]')].map(node => node.id);
    expect(sections).toEqual(['section-Talks', 'section-CareerFair']);
  });

  it('keeps story and journey links inside the authenticated preview', async () => {
    const el = await load();
    expect(el.querySelector('.ms-secondary-cta')?.getAttribute('href')).toBe('/admin/main-segment/2026/preview#story');
    expect(el.querySelector('.journey-anchor-link')?.getAttribute('href')).toBe('/admin/main-segment/2026/preview#section-Talks');
  });

  it('disables real registration while preserving the published registration display', async () => {
    const el = await load({ ...edition, status: MainSegmentEditionStatus.Published, isRegistrationAvailable: true });
    const ctas = [...el.querySelectorAll<HTMLButtonElement>('.ms-primary-cta, .reg-btn-primary')];
    expect(ctas).toHaveLength(2);
    expect(ctas.every(button => button.disabled)).toBe(true);
    const page = fixture.debugElement.query(By.directive(MainSegmentPageComponent)).componentInstance as MainSegmentPageComponent;
    page.openRegistrationModal();
    expect(page.isRegistrationModalOpen).toBe(false);
  });

  it('shows a loading state and a recoverable error instead of a blank preview', async () => {
    expect(fixture.nativeElement.textContent).toContain('Loading Main Segment edition');
    http.expectOne(endpoint).flush({}, { status: 500, statusText: 'Server error' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to Load Edition');
    expect(fixture.nativeElement.textContent).toContain('Try Again');
    expect(fixture.nativeElement.textContent).toContain('Back to editor');
  });

  it('keeps the preview route protected by the admin auth guard', async () => {
    await load();
    expect(routes.find(route => route.path === 'admin/main-segment/:year/preview')?.canActivate).toContain(authGuard);
  });
});
