import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sponsers } from './sponsers';

describe('Sponsers', () => {
  let component: Sponsers;
  let fixture: ComponentFixture<Sponsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sponsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sponsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
