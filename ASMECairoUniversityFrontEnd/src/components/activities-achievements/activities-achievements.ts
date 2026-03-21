import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Component-scoped constants ───────────────────────────────────────────────
const ACTIVITY_CONTENT = {
  slides: [
    {
      bg: 'linear-gradient(135deg,#0d1540 0%,#1a2472 50%,#0a3d7a 100%)',
      tag: 'Competition',
      title: 'ASME E-Fest Middle East & Africa 2024',
      desc: 'Our team secured top positions in multiple engineering challenges, representing Cairo University on the international stage.',
      decoSvg: `<svg viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" stroke="rgba(126,168,248,0.15)" stroke-width="1"/>
        <circle cx="100" cy="100" r="55" stroke="rgba(126,168,248,0.10)" stroke-width="1"/>
        <circle cx="100" cy="100" r="30" stroke="rgba(126,168,248,0.20)" stroke-width="1"/>
        <path d="M100 20L100 180M20 100L180 100" stroke="rgba(126,168,248,0.08)" stroke-width="1"/>
      </svg>`,
    },
    {
      bg: 'linear-gradient(135deg,#071030 0%,#0d2060 50%,#163580 100%)',
      tag: 'Innovation',
      title: 'Autonomous Robotics Project 2024',
      desc: 'Our Robotics Committee unveiled an autonomous navigation system combining mechanical engineering with cutting-edge AI algorithms.',
      decoSvg: `<svg viewBox="0 0 200 200" fill="none">
        <rect x="30" y="30" width="140" height="140" stroke="rgba(126,168,248,0.15)" stroke-width="1"/>
        <rect x="60" y="60" width="80" height="80" stroke="rgba(126,168,248,0.10)" stroke-width="1" transform="rotate(45 100 100)"/>
        <circle cx="100" cy="100" r="20" stroke="rgba(126,168,248,0.20)" stroke-width="1"/>
      </svg>`,
    },
    {
      bg: 'linear-gradient(135deg,#050e28 0%,#102060 50%,#0e2855 100%)',
      tag: 'Community',
      title: 'Engineering for Society Initiative',
      desc: 'ASME Cairo partnered with local NGOs to design low-cost water purification solutions for rural communities.',
      decoSvg: `<svg viewBox="0 0 200 200" fill="none">
        <polygon points="100,20 180,70 180,130 100,180 20,130 20,70" stroke="rgba(126,168,248,0.15)" stroke-width="1" fill="none"/>
        <polygon points="100,50 155,80 155,120 100,150 45,120 45,80"  stroke="rgba(126,168,248,0.10)" stroke-width="1" fill="none"/>
        <circle cx="100" cy="100" r="15" stroke="rgba(126,168,248,0.25)" stroke-width="1"/>
      </svg>`,
    },
  ],

  achievements: [
    {
      title: 'Regional Champions 2024',
      desc:  'First place in the ASME Human Powered Vehicle Challenge — MENA Region, outperforming 14 competing universities.',
    },
    {
      title: 'ISO-Certified Workshop',
      desc:  'Established the first ISO-certified student-run mechanical workshop in Cairo University.',
    },
    {
      title: 'Best Student Chapter 2023',
      desc:  'Recognized by ASME International as the Best Student Chapter in Africa & the Middle East.',
    },
  ],
} as const;
// ──────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-activities-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities-achievements.html',
  styleUrl: './activities-achievements.css',
})
export class ActivitiesAchievements implements AfterViewInit, OnDestroy {
  /** Expose to template */
  readonly ACTIVITY_CONTENT = ACTIVITY_CONTENT;

  currentSlide = 0;
  readonly totalSlides = ACTIVITY_CONTENT.slides.length;

  private autoplayTimer: ReturnType<typeof setInterval> | undefined;
  private revealObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.startAutoplay();
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoplayTimer);
    this.revealObserver?.disconnect();
  }

  // ── Carousel controls ───────────────────────────────────────────────────────
  goTo(index: number): void {
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
    this.autoplayTimer = setInterval(() => this.nextSlide(), 5000);
  }

  // ── Scroll reveal for achievement cards ────────────────────────────────────
  private initScrollReveal(): void {
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