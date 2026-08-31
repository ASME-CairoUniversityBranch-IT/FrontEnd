import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MainSegmentPageComponent } from '../../../main-segment/main-segment-page/main-segment-page';
import { MainSegmentService } from '../../../../core/services/main-segment.service';
import { MainSegmentPreviewService } from '../../../../core/services/main-segment-preview.service';
import { MainFooter } from '../../../../../components/main-footer/main-footer';

@Component({
  selector: 'app-admin-main-segment-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MainSegmentPageComponent, MainFooter],
  providers: [{ provide: MainSegmentService, useClass: MainSegmentPreviewService }],
  template: `
    <header #toolbar class="preview-toolbar">
      <div>
        <strong>Saved-page preview</strong>
        <p>Save changes in the editor, then refresh this tab. Registration is disabled here.</p>
      </div>
      <a [routerLink]="['/admin/main-segment', year]">Back to editor</a>
    </header>
    <app-main-segment-page [isPreview]="true" />
    <app-main-footer />
  `,
  styles: `
    :host { display: block; --main-segment-top-offset: 80px; }
    .preview-toolbar {
      position: fixed; inset: 0 0 auto; z-index: 1100;
      box-sizing: border-box; min-height: 80px; padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
      background: #fff; color: #17213c; border-bottom: 1px solid #dce1eb;
      font-family: var(--font-body);
    }
    strong { font-size: 15px; }
    p { margin: 4px 0 0; color: #5b6476; font-size: 12px; line-height: 1.5; }
    a { flex-shrink: 0; color: #17213c; font-size: 13px; font-weight: 600; text-underline-offset: 4px; }
    a:focus-visible { outline: 2px solid #2563eb; outline-offset: 5px; }
    @media (max-width: 600px) {
      :host { --main-segment-top-offset: 120px; }
      .preview-toolbar { min-height: 120px; padding: 12px 16px; gap: 8px; flex-wrap: wrap; }
    }
  `,
})
export class AdminMainSegmentPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('toolbar') private toolbar!: ElementRef<HTMLElement>;
  private readonly scroller = inject(ViewportScroller);
  readonly year = inject(ActivatedRoute).snapshot.paramMap.get('year');

  ngAfterViewInit(): void {
    // Angular's anchor scrolling does not account for CSS scroll-margin-top.
    this.scroller.setOffset(() => [0, this.toolbar.nativeElement.offsetHeight]);
  }

  ngOnDestroy(): void {
    this.scroller.setOffset([0, 0]);
  }
}
