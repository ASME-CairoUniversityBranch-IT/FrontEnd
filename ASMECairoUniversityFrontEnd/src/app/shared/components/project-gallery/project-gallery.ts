import { Component, HostListener, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryPhoto {
  url: string;
  title: string;
}

@Component({
  selector: 'app-project-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-gallery.html',
  styleUrls: ['./project-gallery.css'],
})
export class ProjectGalleryComponent implements OnDestroy {

  photos: GalleryPhoto[] = [];

  selectedPhoto: GalleryPhoto | null = null;
  private previousBodyOverflow = '';
  private modalTrigger: HTMLElement | null = null;

  @Input() set imageUrls(urls: string[] | null | undefined) {
    this.photos = (urls ?? []).map((url, i) => ({
      url,
      title: `PHOTO ${i + 1}`
    }));
  }

  openImage(photo: GalleryPhoto, trigger?: EventTarget | null): void {
    this.modalTrigger = trigger instanceof HTMLElement ? trigger : null;
    this.previousBodyOverflow = document.body.style.overflow;
    this.selectedPhoto = photo;
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedPhoto = null;
    document.body.style.overflow = this.previousBodyOverflow;
    queueMicrotask(() => this.modalTrigger?.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedPhoto) this.closeImage();
  }

  ngOnDestroy(): void {
    if (this.selectedPhoto) document.body.style.overflow = this.previousBodyOverflow;
  }
}
