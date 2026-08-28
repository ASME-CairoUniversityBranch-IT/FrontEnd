import { Component, AfterViewInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { ContactUs } from '../../../../components/contact-us/contact-us';
import { Committee } from '../../../../components/committee/committee';
import { OurProject } from '../../../../components/our-projects/our-projects';
import { AboutAsme } from '../../../../components/about-asme/about-asme';
import { OurValues } from '../../../../components/our-values/our-values';
import { ActivitiesAchievements } from '../../../../components/activities-achievements/activities-achievements';
import { MainBanner } from '../../../../components/main-banner/main-banner';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ContactUs, OurProject, Committee, AboutAsme, OurValues, ActivitiesAchievements, MainBanner],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sections = this.el.nativeElement.querySelectorAll(
      'app-about-asme, app-our-values, app-activities-achievements, app-our-project, app-committee, app-contact-us'
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    sections.forEach((section: Element) => {
      section.classList.add('reveal-section');
      this.observer?.observe(section);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
