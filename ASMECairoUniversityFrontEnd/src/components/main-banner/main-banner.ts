import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Component-scoped constants ───────────────────────────────────────────────
const HERO_CONTENT = {
  badge: 'American Society of Mechanical Engineers',
  titleLines: ['ASME', 'Cairo', 'University'],
  subtitle:
    "Cairo University's premier engineering society — where innovation meets excellence. " +
    "Building tomorrow's engineers through projects, competitions, and community.",
  ctaPrimary:   { label: 'Explore Projects', href: '#projects' },
  ctaSecondary: { label: 'Join ASME',        href: '#contact'  },
  stats: [
    { target: 500, suffix: '+', label: 'Members'      },
    { target: 40,  suffix: '+', label: 'Projects'     },
    { target: 120, suffix: '+', label: 'Events'       },
    { target: 8,   suffix: '',  label: 'Years Active' },
  ],
} as const;
// ──────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-main-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-banner.html',
  styleUrl: './main-banner.css',
})
export class MainBanner implements AfterViewInit, OnDestroy {
  /** Expose to template */
  readonly HERO_CONTENT = HERO_CONTENT;

  private statsAnimated = false;
  private statsObserver?: IntersectionObserver;
  private counterObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.spawnParticles();
    this.initCounters();
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    this.counterObserver?.disconnect();
  }

  // ── Floating particles ──────────────────────────────────────────────────────
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

  // ── Animated counters ───────────────────────────────────────────────────────
  private initCounters(): void {
    const els = document.querySelectorAll<HTMLElement>('.stat-num');
    this.counterObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || this.statsAnimated) return;
        this.statsAnimated = true;
        els.forEach((el) => {
          const target = parseInt(el.dataset['target'] ?? '0', 10);
          this.animateCount(el, 0, target, 1800);
        });
      },
      { threshold: 0.5 }
    );

    const bar = document.querySelector('.hero-stats');
    if (bar) this.counterObserver.observe(bar);
  }

  private animateCount(el: HTMLElement, start: number, end: number, ms: number): void {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p  = Math.min((now - t0) / ms, 1);
      const ep = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.floor(start + (end - start) * ep));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}