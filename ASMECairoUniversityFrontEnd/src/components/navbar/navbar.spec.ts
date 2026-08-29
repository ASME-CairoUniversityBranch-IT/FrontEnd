import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Navbar } from './navbar';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'main-segment', component: DummyComponent },
          { path: 'main-segment/:year', component: DummyComponent },
          { path: 'projects', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the navbar', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Main Segment navigation link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const msLink = compiled.querySelector('.nav-link.main-segment-link');
    expect(msLink).toBeTruthy();
    expect(msLink?.textContent?.trim()).toBe('Main Segment');
  });

  it('should set Main Segment link as active with aria-current="page" on /main-segment routes', async () => {
    await router.navigateByUrl('/main-segment/2026');
    fixture.detectChanges();

    expect(component.isMainSegmentRoute).toBe(true);
    expect(component.isLandingRoute).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const msLink = compiled.querySelector('.nav-link.main-segment-link');
    expect(msLink?.classList.contains('active')).toBe(true);
    expect(msLink?.getAttribute('aria-current')).toBe('page');

    const homeLink = compiled.querySelector('.nav-link:not(.main-segment-link).active');
    expect(homeLink).toBeNull();
  });

  it('should set home section as active on landing page and not Main Segment', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    component.onNavClick('about');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const msLink = compiled.querySelector('.nav-link.main-segment-link');
    expect(msLink?.classList.contains('active')).toBe(false);
    expect(msLink?.getAttribute('aria-current')).toBeNull();

    const activeLinks = compiled.querySelectorAll('.nav-link.active');
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0].textContent?.trim()).toBe('About');
    expect(activeLinks[0].getAttribute('aria-current')).toBe('page');
  });

  it('should not mark any nav links active on unrelated routes like /projects', async () => {
    await router.navigateByUrl('/projects');
    fixture.detectChanges();

    expect(component.isLandingRoute).toBe(false);
    expect(component.isMainSegmentRoute).toBe(false);
    expect(component.activeSection).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const activeLinks = compiled.querySelectorAll('.nav-link.active');
    expect(activeLinks.length).toBe(0);

    const currentLinks = compiled.querySelectorAll('.nav-link[aria-current]');
    expect(currentLinks.length).toBe(0);
  });

  it('should toggle mobile menu and lock/unlock body scroll', () => {
    expect(component.isMenuOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');

    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    component.toggleMenu();
    expect(component.isMenuOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('should close mobile menu on escape and restore focus', () => {
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);

    component.onEscape();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should close mobile menu on nav click', () => {
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);

    component.onNavClick('about');
    expect(component.isMenuOpen).toBe(false);
  });
});
