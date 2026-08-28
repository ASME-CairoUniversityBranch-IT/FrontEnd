import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sponsor, SponsorshipTier } from '../../../core/models/project.model';
import { SponsersComponent } from './sponsers';

describe('SponsersComponent', () => {
  let fixture: ComponentFixture<SponsersComponent>;
  let component: SponsersComponent;

  const sponsor = (name: string, sponsorshipTier: SponsorshipTier): Sponsor => ({
    id: name,
    name,
    sponsorshipTier,
    photoUrl: `/${name}.png`,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SponsersComponent] }).compileComponents();
    fixture = TestBed.createComponent(SponsersComponent);
    component = fixture.componentInstance;
  });

  it('renders tiers in the intended visual order regardless of API order', () => {
    component.sponsors = [
      sponsor('silver', SponsorshipTier.Silver),
      sponsor('platinum', SponsorshipTier.Platinum),
      sponsor('bronze', SponsorshipTier.Bronze),
      sponsor('gold', SponsorshipTier.Gold),
    ];
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.category-title') as NodeListOf<HTMLElement>,
      (element) => element.textContent?.trim(),
    );
    const grids = fixture.nativeElement.querySelectorAll('.sponsors-grid') as NodeListOf<HTMLElement>;

    expect(labels).toEqual(['Platinum', 'Gold', 'Silver', 'Bronze']);
    expect(Array.from(grids, (grid) => grid.className)).toEqual([
      'sponsors-grid tier-platinum',
      'sponsors-grid tier-gold',
      'sponsors-grid tier-silver',
      'sponsors-grid tier-bronze',
    ]);
  });

  it('keeps sponsors from the same tier in one equal-stage grid', () => {
    component.sponsors = [
      sponsor('gold-one', SponsorshipTier.Gold),
      sponsor('gold-two', SponsorshipTier.Gold),
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.tier-gold .sponsor-logo-stage').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.category-section').length).toBe(1);
  });
});
