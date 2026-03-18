import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Committee } from './committee';

describe('Committee', () => {
  let component: Committee;
  let fixture: ComponentFixture<Committee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Committee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Committee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
