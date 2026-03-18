import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverLap } from './over-lap';

describe('OverLap', () => {
  let component: OverLap;
  let fixture: ComponentFixture<OverLap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverLap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverLap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
