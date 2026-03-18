import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutAsme } from './about-asme';

describe('AboutAsme', () => {
  let component: AboutAsme;
  let fixture: ComponentFixture<AboutAsme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutAsme]
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
