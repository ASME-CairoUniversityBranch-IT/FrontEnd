import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventGallery } from './event-gallery';

describe('EventGallery', () => {
  let component: EventGallery;
  let fixture: ComponentFixture<EventGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventGallery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
