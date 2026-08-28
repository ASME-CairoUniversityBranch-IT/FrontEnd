import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;

  isMenuOpen = false;
  isScrolled = false;
  isMobile = false;

  private scrollHandler = () => {
    this.isScrolled = window.scrollY > 40;
  };

  private activeTrackingCleanup?: () => void;
  private mobileQuery?: MediaQueryList;
  private previousBodyOverflow = '';
  private bodyLocked = false;

  private mobileQueryHandler = (event: MediaQueryListEvent | MediaQueryList) => {
    this.isMobile = event.matches;
    if (!this.isMobile && this.isMenuOpen) this.closeMenu();
  };

  ngOnInit(): void {
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.scrollHandler();
    if (typeof window.matchMedia === 'function') {
      this.mobileQuery = window.matchMedia('(max-width: 900px)');
      this.mobileQueryHandler(this.mobileQuery);
      this.mobileQuery.addEventListener('change', this.mobileQueryHandler);
    }
    this.initActiveTracking();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
    this.mobileQuery?.removeEventListener('change', this.mobileQueryHandler);
    this.unlockBodyScroll();
    this.activeTrackingCleanup?.();
  }

  toggleMenu(): void {
    if (this.isMenuOpen) {
      this.closeMenu();
      return;
    }

    this.isMenuOpen = true;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.bodyLocked = true;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isMenuOpen) return;
    this.closeMenu();
    queueMicrotask(() => this.menuButton?.nativeElement.focus());
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.unlockBodyScroll();
  }

  private unlockBodyScroll(): void {
    if (!this.bodyLocked) return;
    document.body.style.overflow = this.previousBodyOverflow;
    this.bodyLocked = false;
  }

  private initActiveTracking(): void {
    // The landing page runs in a browser, but keeping this guard makes the
    // component safe to instantiate in SSR/test environments as well.
    if (typeof IntersectionObserver === 'undefined') return;

    const sectionIds = ['home', 'about', 'featured', 'achievements', 'projects', 'committees', 'contact'];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          document.querySelectorAll('.nav-link').forEach((link) => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          });
          const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (active) {
            active.classList.add('active');
            active.setAttribute('aria-current', 'page');
          }
        });
      },
      { 
        threshold: 0, 
        rootMargin: '-50% 0px -50% 0px'
       }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    this.activeTrackingCleanup = () => observer.disconnect();
  }
}
