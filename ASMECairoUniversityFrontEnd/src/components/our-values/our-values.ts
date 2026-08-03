import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as AOS from 'aos';
import { ContentService } from '../../app/core/services/content.service';

/** A value card plus the client-only UI state (isOpen) that content.json doesn't need to know about. */
interface ValueCardVM {
  tag: string;
  title: string;
  overlayBody1: string;
  overlayBody2: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-our-values',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '../our-values/our-values.html',
  styleUrls: ['../our-values/our-values.css']
})
export class OurValues implements OnInit {
  /** Non-card section copy, populated from content.json. */
  sectionLabel = '';
  sectionTitle = '';

  /** Cards, each augmented with local `isOpen` UI state. Variable length — driven entirely by content.json. */
  cards: ValueCardVM[] = [];

  loaded = false;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  openCard(card: ValueCardVM): void {
    card.isOpen = true;
  }

  closeCard(card: ValueCardVM): void {
    card.isOpen = false;
  }

  ngOnInit(): void {
    AOS.init();

    this.contentService.getContent().subscribe((data) => {
      this.sectionLabel = data.ourValues.sectionLabel;
      this.sectionTitle = data.ourValues.sectionTitle;
      this.cards = data.ourValues.cards.map((card) => ({ ...card, isOpen: false }));
      this.loaded = true;
      // Cards are rendered via *ngFor once content arrives, so AOS needs to
      // re-scan the DOM for the data-aos elements that just appeared.
      this.cdr.detectChanges();
      AOS.refreshHard();
    });
  }
}
