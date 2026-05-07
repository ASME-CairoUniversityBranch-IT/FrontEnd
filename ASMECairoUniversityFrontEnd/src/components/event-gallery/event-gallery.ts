import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GalleryPhoto {
  id: number;
  url: string;
  title: string;
}

@Component({
  selector: 'app-event-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-gallery.html',
  styleUrls: ['./event-gallery.css']
})
export class EventGalleryComponent implements OnInit {

  // هذه البيانات ستأتي من الـ API لاحقاً
  photos: GalleryPhoto[] = [
    { id: 1, url: 'assets/images/photo1.jpg', title: 'PHOTO 1' },
    { id: 2, url: 'assets/images/photo2.jpg', title: 'PHOTO 2' },
    { id: 3, url: 'assets/images/photo3.jpg', title: 'PHOTO 3' },
    { id: 4, url: 'assets/images/photo4.jpg', title: 'PHOTO 4' },
    { id: 5, url: 'assets/images/photo5.jpg', title: 'PHOTO 5' },
    { id: 6, url: 'assets/images/photo6.jpg', title: 'PHOTO 6' },
  ];

  constructor() {}

  ngOnInit(): void {
    // Logic لجلب الصور من الباك إند هنا
  }
}
