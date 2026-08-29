import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainFooter } from './main-footer';

describe('MainFooter', () => {
  let component: MainFooter;
  let fixture: ComponentFixture<MainFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainFooter],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render cross-page navigation links including Main Segment', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.footer-nav a');
    const linkTexts = Array.from(links).map((l) => l.textContent?.trim());

    expect(linkTexts).toContain('Home');
    expect(linkTexts).toContain('About');
    expect(linkTexts).toContain('Projects');
    expect(linkTexts).toContain('Main Segment');
  });
});
