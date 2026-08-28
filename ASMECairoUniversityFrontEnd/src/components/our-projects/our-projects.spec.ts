import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OurProject } from './our-projects';

describe('OurProject', () => {
  let component: OurProject;
  let fixture: ComponentFixture<OurProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurProject],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
