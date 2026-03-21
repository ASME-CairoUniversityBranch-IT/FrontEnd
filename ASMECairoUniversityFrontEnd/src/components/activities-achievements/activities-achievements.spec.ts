import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivitiesAchievements } from './activities-achievements';

describe('ActivitiesAchievements', () => {
  let component: ActivitiesAchievements;
  let fixture: ComponentFixture<ActivitiesAchievements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitiesAchievements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivitiesAchievements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
