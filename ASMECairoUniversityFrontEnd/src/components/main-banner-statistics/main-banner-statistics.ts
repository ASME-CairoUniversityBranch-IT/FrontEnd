import { Component, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-banner-statistics.html',
  styleUrl: './main-banner-statistics.css',
})
export class HeroStats implements AfterViewInit, OnDestroy {
  @Input({ required: true }) stats!: ReadonlyArray<{
    target: number;
    suffix: string;
    label: string;
  }>;

  private animated = false;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.initCounters();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private initCounters(): void {
    const els = document.querySelectorAll<HTMLElement>('.stat-num');
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || this.animated) return;
        this.animated = true;
        els.forEach((el) => {
          const target = parseInt(el.dataset['target'] ?? '0', 10);
          this.animateCount(el, 0, target, 1800);
        });
      },
      { threshold: 0.5 }
    );

    const bar = document.querySelector('.hero-stats');
    if (bar) this.observer.observe(bar);
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
