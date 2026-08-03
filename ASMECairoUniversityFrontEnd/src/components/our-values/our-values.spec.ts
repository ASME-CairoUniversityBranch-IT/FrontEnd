import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OurValues } from './our-values';

describe('OurValues', () => {
  let component: OurValues;
  let fixture: ComponentFixture<OurValues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurValues],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
