import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectGalleryComponent } from './project-gallery';

describe('ProjectGalleryComponent', () => {
  let fixture: ComponentFixture<ProjectGalleryComponent>;
  let component: ProjectGalleryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectGalleryComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not reserve an empty gallery card', () => {
    component.imageUrls = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gallery-card')).toBeNull();
  });

  it('renders every supplied image and opens the selected image', () => {
    component.imageUrls = ['/one.jpg', '/two.jpg'];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.photo-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);

    items[1].click();
    fixture.detectChanges();

    const modalImage = fixture.nativeElement.querySelector('.modal-image') as HTMLImageElement;
    expect(modalImage.src).toContain('/two.jpg');

    component.closeImage();
  });

  it('closes the dialog with Escape and restores page scrolling', () => {
    component.imageUrls = ['/one.jpg'];
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.photo-item') as HTMLButtonElement;
    item.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});
