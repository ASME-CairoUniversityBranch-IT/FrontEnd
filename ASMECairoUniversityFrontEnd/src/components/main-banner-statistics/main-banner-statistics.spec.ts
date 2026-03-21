import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainBannerStatistics } from './main-banner-statistics';

describe('MainBannerStatistics', () => {
  let component: MainBannerStatistics;
  let fixture: ComponentFixture<MainBannerStatistics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainBannerStatistics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainBannerStatistics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
