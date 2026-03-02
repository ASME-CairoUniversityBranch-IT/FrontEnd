import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainBanenr } from './main-banenr';

describe('MainBanenr', () => {
  let component: MainBanenr;
  let fixture: ComponentFixture<MainBanenr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainBanenr]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainBanenr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
