import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../app/core/services/content.service';
import { AboutAsmeContent } from '../../app/core/models/site-content.model';

@Component({
  selector: 'app-about-asme',
  imports: [CommonModule, RouterModule],
  templateUrl: './about-asme.html',
  styleUrl: './about-asme.css',
})
export class AboutAsme implements OnInit {
  /** Populated from content.json; the template gates on this being non-null. */
  content: AboutAsmeContent | null = null;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.contentService.getContent().subscribe((data) => {
      this.content = data.aboutAsme;
      this.cdr.detectChanges();
    });
  }
}
