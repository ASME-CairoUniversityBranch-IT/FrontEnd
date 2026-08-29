import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { MainSegmentService } from '../../../core/services/main-segment.service';
import { MainSegmentEdition } from '../../../core/models/main-segment.model';
import { NotFoundComponent } from '../../not-found/not-found';

export type MainSegmentPageVM =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error'; message?: string }
  | { status: 'loaded'; edition: MainSegmentEdition };

const DEFAULT_TITLE = 'ASME Cairo University';
const DEFAULT_DESCRIPTION =
  'ASME Cairo University Branch — engineering activities, workshops, events, field trips, and community projects.';

@Component({
  selector: 'app-main-segment-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, DatePipe, NotFoundComponent],
  templateUrl: './main-segment-page.html',
  styleUrl: './main-segment-page.css',
})
export class MainSegmentPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mainSegmentService = inject(MainSegmentService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  private metaSubscription?: Subscription;

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

  retry(): void {
    window.location.reload();
  }
}
