// create-event.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event-service';
import {
  CreateEventDto,
  EventType,
  EventStatus,
  Speaker,
  Partner,
  Sponsor,
  Committee,
  EventTypeOption,
} from '../../models/event.model';




@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../create-event/create-event.html',
  styleUrls: ['../create-event/create-event.css'],
})
export class CreateEventComponent {
  // ── Static options ──
  eventTypes: EventTypeOption[];
  icons: string[];
  committees: Committee[];

  // ── UI state ──
  activeTab: 'speakers' | 'partners' | 'sponsors';
  coverPreview: string | null;
  isDragOver: boolean;
  tagInput: string;
  expandedIndex: number;
  expandedType: string;

  // ── Form fields (flat — no nested object) ──
  eventType: EventType;
  title: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  date: string;
  time: string;
  location: string;
  organisingCommittee: string;
  capacity: number | undefined;
  registrationDeadline: string;
  status: EventStatus;
  tags: string[];
  coverImage: File | null;
  speakers: Speaker[];
  partners: Partner[];
  sponsors: Sponsor[];

  constructor(private eventService: EventService) {
    // static options
    this.eventTypes = [
      { value: 'event', label: 'EVENT', emoji: '🚀' },
      { value: 'workshop', label: 'WORKSHOP', emoji: '🖥️' },
      { value: 'field_trip', label: 'FIELD TRIP', emoji: '🏭' },
      { value: 'competition', label: 'COMPETITION', emoji: '🏁' },
    ];

    this.icons = [
      '🚀',
      '💡',
      '🏁',
      '⚙️',
      '🔬',
      '📋',
      '🖥️',
      '📊',
      '🔧',
      '📐',
      '⚓',
      '✈️',
      '👤',
      '🎉',
      '🌍',
      '🔭',
      '💧',
      '♻️',
      '📈',
      '🎯',
      '🎓',
      '🏆',
      '⚡',
      '🚴',
      '🌸',
      '📉',
    ];

    this.committees = [
      { value: 'technical', label: 'Technical Committee' },
      { value: 'events', label: 'Events Committee' },
      { value: 'outreach', label: 'Outreach Committee' },
      { value: 'media', label: 'Media Committee' },
    ];

    // UI state
    this.activeTab = 'speakers';
    this.coverPreview = null;
    this.isDragOver = false;
    this.tagInput = '';
    this.expandedIndex = -1;
    this.expandedType = '';

    // form fields
    this.eventType = 'event';
    this.title = '';
    this.shortDescription = '';
    this.longDescription = '';
    this.icon = '🚀';
    this.date = '';
    this.time = '';
    this.location = '';
    this.organisingCommittee = '';
    this.capacity = undefined;
    this.registrationDeadline = '';
    this.status = 'upcoming';
    this.tags = [];
    this.coverImage = null;
    this.speakers = [];
    this.partners = [];
    this.sponsors = [];
  }

  // ── Validation ──
  get requiredRemaining(): number {
    let missing = 0;
    if (!this.title.trim()) missing++;
    if (!this.shortDescription.trim()) missing++;
    if (!this.icon) missing++;
    if (!this.date) missing++;
    if (!this.location.trim()) missing++;
    return missing;
  }

  // ── Section 5: expand / collapse ──
  toggleExpand(type: string, index: number): void {
    if (this.expandedType === type && this.expandedIndex === index) {
      this.expandedIndex = -1;
      this.expandedType = '';
    } else {
      this.expandedIndex = index;
      this.expandedType = type;
    }
  }

  // ── Tags ──
  addTag(event: Event): void {
    event.preventDefault();
    const trimmed = this.tagInput.replace(',', '').trim();
    if (trimmed && !this.tags.includes(trimmed)) {
      this.tags = [...this.tags, trimmed];
    }
    this.tagInput = '';
  }

  removeTag(index: number): void {
    this.tags = this.tags.filter((_: string, i: number) => i !== index);
  }

  // ── Cover image ──
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file =
      event.dataTransfer && event.dataTransfer.files[0] ? event.dataTransfer.files[0] : null;
    this.setFile(file);
  }

  removeImage(event: MouseEvent): void {
    event.stopPropagation();
    this.coverPreview = null;
    this.coverImage = null;
  }

  private setFile(file: File | null): void {
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5 MB.');
      return;
    }
    this.coverImage = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.coverPreview = e.target ? (e.target.result as string) : null;
    };
    reader.readAsDataURL(file);
  }

  // ── Add entries ──
  addSpeaker(): void {
    const speaker: Speaker = { fullName: '', role: '', shortBio: '' };
    this.speakers = [...this.speakers, speaker];
    this.expandedType = 'speaker';
    this.expandedIndex = this.speakers.length - 1;
  }

  addPartner(): void {
    const partner: Partner = { name: '', role: '' };
    this.partners = [...this.partners, partner];
    this.expandedType = 'partner';
    this.expandedIndex = this.partners.length - 1;
  }

  addSponsor(): void {
    const sponsor: Sponsor = { name: '', tier: '' };
    this.sponsors = [...this.sponsors, sponsor];
    this.expandedType = 'sponsor';
    this.expandedIndex = this.sponsors.length - 1;
  }

  // ── Remove entries ──
  removeSpeaker(index: number): void {
    this.speakers = this.speakers.filter((_: Speaker, i: number) => i !== index);
    if (this.expandedType === 'speaker' && this.expandedIndex === index) {
      this.expandedIndex = -1;
      this.expandedType = '';
    }
  }

  removePartner(index: number): void {
    this.partners = this.partners.filter((_: Partner, i: number) => i !== index);
    if (this.expandedType === 'partner' && this.expandedIndex === index) {
      this.expandedIndex = -1;
      this.expandedType = '';
    }
  }

  removeSponsor(index: number): void {
    this.sponsors = this.sponsors.filter((_: Sponsor, i: number) => i !== index);
    if (this.expandedType === 'sponsor' && this.expandedIndex === index) {
      this.expandedIndex = -1;
      this.expandedType = '';
    }
  }

  // ── Build DTO and submit ──
  private buildDto(): CreateEventDto {
    return {
      eventType: this.eventType,
      title: this.title,
      shortDescription: this.shortDescription,
      longDescription: this.longDescription,
      icon: this.icon,
      date: this.date,
      time: this.time,
      location: this.location,
      organisingCommittee: this.organisingCommittee,
      capacity: this.capacity,
      registrationDeadline: this.registrationDeadline,
      status: this.status,
      tags: this.tags,
      coverImage: this.coverImage,
      speakers: this.speakers,
      partners: this.partners,
      sponsors: this.sponsors,
    };
  }

  onPublish(): void {
    if (this.requiredRemaining > 0) {
      return;
    }
    this.eventService.createEvent(this.buildDto()).subscribe({
      next: (res: any) => console.log('Event published:', res),
      error: (err: any) => console.error('Publish failed:', err),
    });
  }

  onSaveDraft(): void {
    this.eventService.saveDraft(this.buildDto()).subscribe({
      next: (res: any) => console.log('Draft saved:', res),
      error: (err: any) => console.error('Save draft failed:', err),
    });
  }

  clearForm(): void {
    this.eventType = 'event';
    this.title = '';
    this.shortDescription = '';
    this.longDescription = '';
    this.icon = '🚀';
    this.date = '';
    this.time = '';
    this.location = '';
    this.organisingCommittee = '';
    this.capacity = undefined;
    this.registrationDeadline = '';
    this.status = 'upcoming';
    this.tags = [];
    this.coverImage = null;
    this.speakers = [];
    this.partners = [];
    this.sponsors = [];
    this.coverPreview = null;
    this.tagInput = '';
    this.expandedIndex = -1;
    this.expandedType = '';
  }
}
