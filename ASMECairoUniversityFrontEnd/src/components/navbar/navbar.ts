import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isMenuOpen = false;
  isScrolled = false;
  isMobile = false;

  activeSection: string | null = 'home';
  isLandingRoute = true;
  isMainSegmentRoute = false;

  private routerSub?: Subscription;
  private activeTrackingCleanup?: () => void;
  private mobileQuery?: MediaQueryList;
  private previousBodyOverflow = '';
  private bodyLocked = false;

  private scrollHandler = () => {
    this.isScrolled = window.scrollY > 40;
    this.cdr.markForCheck();
  };

  private mobileQueryHandler = (event: MediaQueryListEvent | MediaQueryList) => {
    this.isMobile = event.matches;
    if (!this.isMobile && this.isMenuOpen) {
      this.closeMenu();
    }
    this.cdr.markForCheck();
  };

  ngOnInit(): void {
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.scrollHandler();

    if (typeof window.matchMedia === 'function') {
      this.mobileQuery = window.matchMedia('(max-width: 900px)');
      this.mobileQueryHandler(this.mobileQuery);
      this.mobileQuery.addEventListener('change', this.mobileQueryHandler);
    }

    this.updateRouteState(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateRouteState(event.urlAfterRedirects || event.url);
        this.closeMenu();
      });

    this.initActiveTracking();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
    this.mobileQuery?.removeEventListener('change', this.mobileQueryHandler);
    this.routerSub?.unsubscribe();
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
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isMenuOpen) return;
    this.closeMenu();
    queueMicrotask(() => this.menuButton?.nativeElement.focus());
  }

  onScrimClick(): void {
    this.closeMenu();
    queueMicrotask(() => this.menuButton?.nativeElement.focus());
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.unlockBodyScroll();
    this.cdr.markForCheck();
  }

  onNavClick(sectionId?: string): void {
    this.closeMenu();
    if (this.isLandingRoute && sectionId) {
      this.activeSection = sectionId;
      this.cdr.markForCheck();
      if (typeof document !== 'undefined') {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  onLogoClick(): void {
    this.closeMenu();
    if (this.isLandingRoute) {
      this.activeSection = 'home';
      this.cdr.markForCheck();
      if (typeof window !== 'undefined') {
        const el = document.getElementById('home');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }

  private normalizePath(url: string): string {
    if (!url) return '/';
    const path = url.split(/[?#]/, 1)[0];
    return path.startsWith('/') ? path : `/${path}`;
  }

  private updateRouteState(url: string): void {
    const normalized = this.normalizePath(url);
    this.isLandingRoute = normalized === '/';
    this.isMainSegmentRoute = normalized.startsWith('/main-segment');

    if (this.isMainSegmentRoute || !this.isLandingRoute) {
      this.activeSection = null;
    } else if (!this.activeSection) {
      this.activeSection = 'home';
    }
    this.cdr.markForCheck();
  }

  private unlockBodyScroll(): void {
    if (!this.bodyLocked) return;
    document.body.style.overflow = this.previousBodyOverflow;
    this.bodyLocked = false;
  }

  private initActiveTracking(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const sectionIds = [
      'home',
      'about',
      'featured',
      'achievements',
      'projects',
      'committees',
      'contact',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        if (!this.isLandingRoute) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
            this.cdr.markForCheck();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-40% 0px -40% 0px',
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    this.activeTrackingCleanup = () => observer.disconnect();
  }
}
