import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as AOS from 'aos';


interface ValueCard {
  id: string;
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
export class OurValues {
  cards: ValueCard[] = [
    {
      id: 'card-1',
      tag: 'One Team',
      title: 'One Goal',
      overlayBody1: 'We move as one. Every decision, every effort, every win — shared across the entire team. No silos, no solo missions. When one of us succeeds, all of us succeed.',
      overlayBody2: 'Our unity is our greatest competitive advantage.',
      isOpen: false
    },
    {
      id: 'card-2',
      tag: 'Grow',
      title: 'Together',
      overlayBody1: 'Growth is not a solo sport. We invest in each other\'s development, share knowledge openly, and lift each other higher. Real progress is collective progress.',
      overlayBody2: 'We celebrate every step forward — big or small.',
      isOpen: false
    },
    {
      id: 'card-3',
      tag: 'Drive Change',
      title: 'With Ownership',
      overlayBody1: 'We don\'t wait for permission. We take initiative, own our outcomes, and lead change from wherever we stand. Accountability isn\'t a rule — it\'s a mindset.',
      overlayBody2: 'Act like an owner. Think long-term. Deliver.',
      isOpen: false
    },
     {
      id: 'card-4',
      tag: 'Shape What\'s',
      title: 'NEXT',
      overlayBody1: 'We don\'t wait for permission. We take initiative, own our outcomes, and lead change from wherever we stand. Accountability isn\'t a rule — it\'s a mindset.',
      overlayBody2: 'Act like an owner. Think long-term. Deliver.',
      isOpen: false
    }

  ];

  openCard(card: ValueCard): void {
    card.isOpen = true;
  }

  closeCard(card: ValueCard): void {
    card.isOpen = false;
  }
  ngOnInit(): void {
    AOS.init();
  }
}
