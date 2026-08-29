import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { MainSegmentService } from '../../../core/services/main-segment.service';
import {
  MainSegmentEdition,
  MainSegmentOrganization,
  MainSegmentSection,
  MainSegmentSectionKey,
} from '../../../core/models/main-segment.model';
import {
  getOrgInitials,
  getPersonInitials,
  getSectionDisplayTitle,
  getSectionEyebrow,
  groupSponsorsByTier,
  hasSectionContent,
  SponsorGroup,
} from '../../../core/utils/main-segment.util';
import { NotFoundComponent } from '../../not-found/not-found';
import { MainSegmentRegistrationModalComponent } from '../main-segment-registration-modal/main-segment-registration-modal';

export type MainSegmentPageVM =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error'; message?: string }
  | { status: 'loaded'; edition: MainSegmentEdition };

export interface JourneyStep {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
  sectionId: string;
  iconClass: string;
}

const DEFAULT_TITLE = 'ASME Cairo University';
const DEFAULT_DESCRIPTION =
  'ASME Cairo University Branch — engineering activities, workshops, events, field trips, and community projects.';

@Component({
  selector: 'app-main-segment-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    NotFoundComponent,
    MainSegmentRegistrationModalComponent,
  ],
  templateUrl: './main-segment-page.html',
  styleUrl: './main-segment-page.css',
})
export class MainSegmentPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mainSegmentService = inject(MainSegmentService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  private metaSubscription?: Subscription;
  isRegistrationModalOpen = false;

  readonly journeySteps: JourneyStep[] = [
    {
      step: '01',
      eyebrow: 'PERSPECTIVE',
      title: 'Panel Discussions',
      description:
        'High-level dialogue with engineering and industry leaders addressing modern sector challenges and emerging technologies.',
      sectionId: 'section-PanelDiscussion',
      iconClass: 'fa-solid fa-users-rectangle',
    },
    {
      step: '02',
      eyebrow: 'KNOWLEDGE',
      title: 'Keynote & Technical Talks',
      description:
        'Deep-dive presentations by specialized subject matter experts delivering actionable mechanical and industrial engineering insights.',
      sectionId: 'section-Talks',
      iconClass: 'fa-solid fa-microphone',
    },
    {
      step: '03',
      eyebrow: 'PRACTICE',
      title: 'Hands-on Workshops',
      description:
        'Interactive technical sessions providing applied practice in modern engineering tools, simulation software, and prototyping.',
      sectionId: 'section-Workshops',
      iconClass: 'fa-solid fa-wrench',
    },
    {
      step: '04',
      eyebrow: 'DIRECTION',
      title: 'Mentorship Circles',
      description:
        'Small-group roundtables connecting undergraduate engineers directly with experienced industry mentors for personalized career guidance.',
      sectionId: 'section-MentorshipCircles',
      iconClass: 'fa-solid fa-compass',
    },
    {
      step: '05',
      eyebrow: 'OPPORTUNITY',
      title: 'Career Fair',
      description:
        'Direct recruitment touchpoints with leading engineering firms offering internship and entry-level employment opportunities.',
      sectionId: 'section-CareerFair',
      iconClass: 'fa-solid fa-briefcase',
    },
    {
      step: '06',
      eyebrow: 'READINESS',
      title: 'CV Review & Mock Interviews',
      description:
        'One-on-one technical resume critique and live mock interviews with corporate recruiters to refine candidate presentation.',
      sectionId: 'section-CvReviewAndMockInterviews',
      iconClass: 'fa-solid fa-file-circle-check',
    },
  ];

  readonly vm$: Observable<MainSegmentPageVM> = this.route.paramMap.pipe(
    switchMap((params) => {
      const yearParam = params.get('year');
      const year = yearParam ? Number(yearParam) : NaN;

      if (isNaN(year) || year <= 0 || !Number.isInteger(year)) {
        return of<MainSegmentPageVM>({ status: 'notFound' });
      }

      return this.mainSegmentService.getByYear(year).pipe(
        map((edition): MainSegmentPageVM => ({ status: 'loaded', edition })),
        startWith<MainSegmentPageVM>({ status: 'loading' }),
        catchError((err) => {
          if (err?.status === 404) {
            return of<MainSegmentPageVM>({ status: 'notFound' });
          }
          return of<MainSegmentPageVM>({
            status: 'error',
            message: 'Unable to load this edition right now. Please try again later.',
          });
        })
      );
    }),
    tap((vm) => {
      if (vm.status === 'loaded') {
        this.updateMeta(vm.edition);
      } else if (vm.status === 'notFound') {
        this.titleService.setTitle(`Edition Not Found | ${DEFAULT_TITLE}`);
      }
    })
  );

  ngOnInit(): void {
    // VM stream handles initialization and meta updates through tap()
  }

  ngOnDestroy(): void {
    this.metaSubscription?.unsubscribe();
    this.titleService.setTitle(DEFAULT_TITLE);
    this.metaService.updateTag({ name: 'description', content: DEFAULT_DESCRIPTION });
    this.metaService.updateTag({ property: 'og:title', content: DEFAULT_TITLE });
    this.metaService.updateTag({ property: 'og:description', content: DEFAULT_DESCRIPTION });
  }

  openRegistrationModal(): void {
    this.isRegistrationModalOpen = true;
  }

  closeRegistrationModal(): void {
    this.isRegistrationModalOpen = false;
  }

  getPersonInitials(name: string): string {
    return getPersonInitials(name);
  }

  getOrgInitials(name: string): string {
    return getOrgInitials(name);
  }

  groupSponsors(sponsors: MainSegmentOrganization[]): SponsorGroup[] {
    return groupSponsorsByTier(sponsors);
  }

  hasSectionContent(section: MainSegmentSection): boolean {
    return hasSectionContent(section);
  }

  getSectionTitle(key: MainSegmentSectionKey): string {
    return getSectionDisplayTitle(key);
  }

  getSectionEyebrow(key: MainSegmentSectionKey): string {
    return getSectionEyebrow(key);
  }

  isProgramSection(key: MainSegmentSectionKey): boolean {
    return (
      key === MainSegmentSectionKey.PanelDiscussion ||
      key === MainSegmentSectionKey.Talks ||
      key === MainSegmentSectionKey.Workshops ||
      key === MainSegmentSectionKey.MentorshipCircles
    );
  }

  isSponsorSection(key: MainSegmentSectionKey): boolean {
    return key === MainSegmentSectionKey.Sponsors;
  }

  isPartnerSection(key: MainSegmentSectionKey): boolean {
    return key === MainSegmentSectionKey.Partners;
  }

  isOrgGridSection(key: MainSegmentSectionKey): boolean {
    return (
      key === MainSegmentSectionKey.CareerFair ||
      key === MainSegmentSectionKey.CvReviewAndMockInterviews
    );
  }

  isRegistrationScheduled(edition: MainSegmentEdition): boolean {
    if (edition.registration.isAvailable) return false;
    if (!edition.registration.opensAt) return false;
    const opens = new Date(edition.registration.opensAt).getTime();
    return opens > Date.now();
  }

  retry(): void {
    window.location.reload();
  }

  private updateMeta(edition: MainSegmentEdition): void {
    const pageTitle = `${edition.title || `Main Segment ${edition.year}`} | ASME Cairo University`;
    const description =
      edition.heroContent?.trim() ||
      edition.storyContent?.trim() ||
      `Explore ASME Cairo University Main Segment ${edition.year} — featuring panel discussions, talks, workshops, mentorship circles, career fair, and mock interviews.`;

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
  }
}
