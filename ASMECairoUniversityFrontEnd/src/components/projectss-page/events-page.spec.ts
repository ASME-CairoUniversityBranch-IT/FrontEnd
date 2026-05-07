import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Try } from './try';

describe('Try', () => {
  let component: Try;
  let fixture: ComponentFixture<Try>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Try]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Try);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
