import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../app/core/services/content.service';
import { ActivitiesAchievementsContent } from '../../app/core/models/site-content.model';

@Component({
  selector: 'app-activities-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities-achievements.html',
  styleUrl: './activities-achievements.css',
})
export class ActivitiesAchievements implements OnInit, OnDestroy {
  /** Populated from content.json; the template gates on this being non-null.
   *  Slides and achievements are both variable-length arrays driven entirely by content.json. */
  content: ActivitiesAchievementsContent | null = null;

  currentSlide = 0;
  totalSlides = 0;

  private autoplayTimer: ReturnType<typeof setInterval> | undefined;
  private revealObserver?: IntersectionObserver;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe((data) => {
      this.content = data.activitiesAchievements;
      this.totalSlides = this.content.slides.length;
      // Slides/achievement cards are rendered via *ngFor once content arrives —
      // force the view to render now so the carousel/reveal init below can find
      // the actual DOM nodes, then wire up the carousel and scroll-reveal behavior.
      this.cdr.detectChanges();
      this.startAutoplay();
      this.initScrollReveal();
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.autoplayTimer);
    this.revealObserver?.disconnect();
  }

  // ── Carousel controls ───────────────────────────────────────────────────────
  goTo(index: number): void {
    if (this.totalSlides === 0) return;
    this.currentSlide = ((index % this.totalSlides) + this.totalSlides) % this.totalSlides;
    const track = document.getElementById('activityCarouselSlides');
    if (track) track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
  }

  nextSlide(): void { this.goTo(this.currentSlide + 1); }
  prevSlide(): void { this.goTo(this.currentSlide - 1); }

  onCarouselEnter(): void { clearInterval(this.autoplayTimer); }
  onCarouselLeave(): void { this.startAutoplay(); }

  private startAutoplay(): void {
    clearInterval(this.autoplayTimer);
    if (this.totalSlides <= 1) return;
    this.autoplayTimer = setInterval(() => this.nextSlide(), 5000);
  }

  // ── Scroll reveal for achievement cards ────────────────────────────────────
  private initScrollReveal(): void {
    this.revealObserver?.disconnect();

    const cards = document.querySelectorAll<HTMLElement>('.achievement-card');

    cards.forEach((el, i) => {
      el.classList.add('reveal');
      if (i % 3 === 1) el.classList.add('reveal-delay-1');
      if (i % 3 === 2) el.classList.add('reveal-delay-2');
    });

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            this.revealObserver!.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => this.revealObserver!.observe(el));
  }
}
