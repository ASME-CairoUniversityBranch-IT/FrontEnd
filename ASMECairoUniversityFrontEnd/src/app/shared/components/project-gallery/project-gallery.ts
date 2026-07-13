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

  /** Backend gallery URLs — mapped into display photos as they arrive. */
  @Input() set imageUrls(urls: string[] | null | undefined) {
    this.photos = (urls ?? []).map((url, i) => ({ url, title: `PHOTO ${i + 1}` }));
  }
}
