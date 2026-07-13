import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectGalleryComponent } from './project-gallery';

describe('EventGallery', () => {
  let component: ProjectGalleryComponent;
  let fixture: ComponentFixture<ProjectGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectGalleryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectGalleryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
