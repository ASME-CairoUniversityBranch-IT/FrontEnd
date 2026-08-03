import { Component, AfterViewInit, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
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
export class MainBanner implements OnInit, AfterViewInit, OnDestroy {
  /** Populated from content.json; the template gates on this being non-null. */
  heroContent: MainBannerContent | null = null;

  constructor(private contentService: ContentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe((content) => {
      this.heroContent = content.mainBanner;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    // The particle background is purely decorative and doesn't depend on
    // content.json, so it can be spawned immediately regardless of load timing.
    this.spawnParticles();
  }

  ngOnDestroy(): void {}

  private spawnParticles(): void {
    const container = document.getElementById('heroBannerParticles');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1;
      p.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 100 + 100}%`,
        `animation-duration:${Math.random() * 15 + 10}s`,
        `animation-delay:${Math.random() * 10}s`,
        `opacity:0`,
      ].join(';');
      container.appendChild(p);
    }
  }
}
