import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroStats } from './main-banner-statistics';

describe('HeroStats', () => {
  let component: HeroStats;
  let fixture: ComponentFixture<HeroStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
