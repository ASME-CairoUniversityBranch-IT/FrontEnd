import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroStats } from '../main-banner-statistics/main-banner-statistics';

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

@Component({
  selector: 'app-main-banner',
  standalone: true,
  imports: [CommonModule, HeroStats],
  templateUrl: './main-banner.html',
  styleUrl: './main-banner.css',
})
export class MainBanner implements AfterViewInit, OnDestroy {
  readonly HERO_CONTENT = HERO_CONTENT;

  private particlesContainer?: HTMLElement;

  ngAfterViewInit(): void {
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