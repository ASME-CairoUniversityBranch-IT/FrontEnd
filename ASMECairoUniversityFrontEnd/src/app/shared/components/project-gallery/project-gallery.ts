import { Component, Input } from '@angular/core';
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
export class ProjectGalleryComponent {

  photos: GalleryPhoto[] = [];

  selectedPhoto: GalleryPhoto | null = null;

  @Input() set imageUrls(urls: string[] | null | undefined) {
    this.photos = (urls ?? []).map((url, i) => ({
      url,
      title: `PHOTO ${i + 1}`
    }));
  }

  openImage(photo: GalleryPhoto): void {
    this.selectedPhoto = photo;
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedPhoto = null;
    document.body.style.overflow = '';
  }
}