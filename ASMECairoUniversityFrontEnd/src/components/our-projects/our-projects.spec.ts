import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurProjects } from './our-projects';

describe('OurProjects', () => {
  let component: OurProjects;
  let fixture: ComponentFixture<OurProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurProjects]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurProjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
