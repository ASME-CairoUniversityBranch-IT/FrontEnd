import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  private activeCardTrigger: HTMLElement | null = null;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  openCard(card: ValueCardVM, trigger?: EventTarget | null): void {
    this.activeCardTrigger = trigger instanceof HTMLElement ? trigger : null;
    card.isOpen = true;
  }

  closeCard(card: ValueCardVM): void {
    card.isOpen = false;
    queueMicrotask(() => this.activeCardTrigger?.focus());
  }

  @HostListener('document:keydown.escape')
  closeOpenCards(): void {
    const hadOpenCard = this.cards.some((card) => card.isOpen);
    this.cards.forEach((card) => card.isOpen = false);
    if (hadOpenCard) queueMicrotask(() => this.activeCardTrigger?.focus());
  }

  ngOnInit(): void {
    this.contentService.getContent().subscribe((data) => {
      this.sectionLabel = data.ourValues.sectionLabel;
      this.sectionTitle = data.ourValues.sectionTitle;
      this.cards = data.ourValues.cards.map((card) => ({ ...card, isOpen: false }));
      this.loaded = true;
      this.cdr.detectChanges();
    });
  }
}
