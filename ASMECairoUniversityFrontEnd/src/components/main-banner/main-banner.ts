import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroStats } from '../main-banner-statistics/main-banner-statistics';
import { ContentService } from '../../app/core/services/content.service';
import { MainBannerContent } from '../../app/core/models/site-content.model';

@Component({
  selector: 'app-main-banner',
  standalone: true,
  imports: [CommonModule, HeroStats],
  templateUrl: './main-banner.html',
  styleUrl: './main-banner.css',
})
export class MainBanner implements OnInit {
  /** Populated from content.json; the template gates on this being non-null. */
  heroContent: MainBannerContent | null = null;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe((content) => {
      this.heroContent = content.mainBanner;
      this.cdr.detectChanges();
    });
  }
}
