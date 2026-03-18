import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurValues } from './our-values';

describe('OurValues', () => {
  let component: OurValues;
  let fixture: ComponentFixture<OurValues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurValues]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurValues);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
