import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import AOS from 'aos';
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
    AOS.init();

    this.contentService.getContent().subscribe((data) => {
      this.content = data.aboutAsme;
      // Cards are rendered via *ngFor once content arrives, so AOS needs to
      // re-scan the DOM for the data-aos elements that just appeared.
      this.cdr.detectChanges();
      AOS.refreshHard();
    });
  }
}
