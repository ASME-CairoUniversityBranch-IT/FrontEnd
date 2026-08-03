import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AboutAsme } from './about-asme';

describe('AboutAsme', () => {
  let component: AboutAsme;
  let fixture: ComponentFixture<AboutAsme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutAsme],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutAsme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
