import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { ProjectsService } from '../../../core/services/projects.service';
import { ProjectType, PrizeCurrency, Speaker, Partner, Sponsor, SponsorshipTier, Instructor } from '../../../core/models/project.model';
import { ALL_PROJECT_TYPES, projectTypeIcon, projectTypeLabel } from '../../../core/utils/project-route.util';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownComponent],
  templateUrl: './create-project.html',
  styleUrls: ['./create-project.css', '../../../shared/styles/markdown-body.css'],
})
export class CreateProjectComponent {
  readonly ProjectType = ProjectType;
  readonly PrizeCurrency = PrizeCurrency;
  readonly types = ALL_PROJECT_TYPES;
  readonly SponsorshipTier = SponsorshipTier;

  readonly projectTypeIcon = projectTypeIcon;
  readonly projectTypeLabel = projectTypeLabel;

  // ── Type selection ──
  selectedType: ProjectType = ProjectType.Event;

  // ── Common fields ──
  title = '';
  shortDescription = '';
  longDescription = '';
  descriptionView: 'write' | 'preview' = 'write';
  location = '';
  date = '';   // yyyy-mm-dd
  time = '';   // HH:mm
  coverImage: File | null = null;
  coverPreview: string | null = null;
  isDragOver = false;
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];

  // ── Event fields ──
  ticketPrice: number | undefined;
  scheduleNotes = '';
  comment = '';
  speakers: Speaker[] = [];
  partners: Partner[] = [];
  sponsors: Sponsor[] = [];

  activeTab: 'speakers' | 'partners' | 'sponsors' = 'speakers';

  // ── Workshop fields ──
  startDate = '';
  endDate = '';
  numberOfSessions: number | undefined;
  instructors: Instructor[] = [];

  // ── FieldTrip fields ──
  destinationName = '';
  departureTime = '';
  returnTime = '';
  meetingPoint = '';
  transportationDetails = '';
  capacity: number | undefined;
  price: number | undefined;
  registrationUrl = '';
  requirements = '';
  notes = '';

  // ── Competition fields ──
  prize: number | undefined;
  prizeCurrency: PrizeCurrency = PrizeCurrency.EGP;
  maxParticipantsPerTeam: number | undefined;

  submitting = false;
  submitError = '';

  constructor(private projectsService: ProjectsService, private router: Router) {}

  get requiredRemaining(): number {
    let missing = 0;
    if (!this.title.trim()) missing++;
    if (!this.shortDescription.trim()) missing++;
    if (!this.date) missing++;
    if (!this.location.trim()) missing++;
    return missing;
  }

  // ── Cover image ──
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setCoverFile(input.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    this.setCoverFile(event.dataTransfer?.files?.[0] ?? null);
  }

  removeImage(event: MouseEvent): void {
    event.stopPropagation();
    this.coverPreview = null;
    this.coverImage = null;
  }

  private setCoverFile(file: File | null): void {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return; }
    this.coverImage = file;
    const reader = new FileReader();
    reader.onload = e => (this.coverPreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Gallery images ──
  onGallerySelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.galleryFiles.push(...files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => this.galleryPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number): void {
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
  }

  addSpeaker(): void { this.speakers = [...this.speakers, { name: '', title: '', shortBio: '' }]; }
  removeSpeaker(i: number): void { this.speakers = this.speakers.filter((_, idx) => idx !== i); }

  addPartner(): void { this.partners = [...this.partners, { name: '', partnerType: '', isMainPartner: false }]; }
  removePartner(i: number): void { this.partners = this.partners.filter((_, idx) => idx !== i); }

  addSponsor(): void { this.sponsors = [...this.sponsors, { name: '', sponsorshipTier: SponsorshipTier.Gold }]; }
  removeSponsor(i: number): void { this.sponsors = this.sponsors.filter((_, idx) => idx !== i); }

  addInstructor(): void { this.instructors = [...this.instructors, { fullName: '', title: '', bio: '', specialization: '', email: '' }]; }
  removeInstructor(i: number): void { this.instructors = this.instructors.filter((_, idx) => idx !== i); }

  private buildCommonFormData(): FormData {
    const fd = new FormData();
    fd.append('Title', this.title);
    fd.append('ShortDescription', this.shortDescription);
    fd.append('LongDescription', this.longDescription);
    fd.append('Location', this.location);
    fd.append('MainDateAndTime', new Date(`${this.date}T${this.time || '00:00'}`).toISOString());
    if (this.coverImage) fd.append('CoverImage', this.coverImage);
    this.galleryFiles.forEach((file, i) => {
      fd.append('GalleryImages', file);
      fd.append('GalleryImagesOrder', String(i));
    });
    return fd;
  }

  private buildFormData(): FormData {
    const fd = this.buildCommonFormData();

    switch (this.selectedType) {
      case ProjectType.Event:
        if (this.ticketPrice != null) fd.append('TicketPrice', String(this.ticketPrice));
        fd.append('ScheduleNotes', this.scheduleNotes);
        fd.append('Comment', this.comment);
        fd.append('Speakers', JSON.stringify(this.speakers.filter(s => s.name.trim())));
        fd.append('Partners', JSON.stringify(this.partners.filter(p => p.name.trim())));
        fd.append('Sponsors', JSON.stringify(this.sponsors.filter(s => s.name.trim())));
        break;

      case ProjectType.Workshop:
        if (this.startDate) fd.append('StartDate', new Date(this.startDate).toISOString());
        if (this.endDate) fd.append('EndDate', new Date(this.endDate).toISOString());
        if (this.numberOfSessions != null) fd.append('NumberOfSessions', String(this.numberOfSessions));
        fd.append('Instructors', JSON.stringify(this.instructors.filter(i => i.fullName.trim())));
        break;

      case ProjectType.FieldTrip:
        fd.append('DestinationName', this.destinationName);
        if (this.departureTime) fd.append('DepartureTime', new Date(this.departureTime).toISOString());
        if (this.returnTime) fd.append('ReturnTime', new Date(this.returnTime).toISOString());
        fd.append('MeetingPoint', this.meetingPoint);
        fd.append('TransportationDetails', this.transportationDetails);
        if (this.capacity != null) fd.append('Capacity', String(this.capacity));
        if (this.price != null) fd.append('Price', String(this.price));
        fd.append('RegistrationUrl', this.registrationUrl);
        fd.append('Requirements', this.requirements);
        fd.append('Notes', this.notes);
        break;

      case ProjectType.Competition:
        if (this.prize != null) fd.append('Prize', String(this.prize));
        fd.append('PrizeCurrency', String(this.prizeCurrency));
        if (this.maxParticipantsPerTeam != null) fd.append('MaxParticipantsPerTeam', String(this.maxParticipantsPerTeam));
        break;
    }

    return fd;
  }

  onPublish(): void {
    if (this.requiredRemaining > 0) return;
    this.submitting = true;
    this.submitError = '';
    this.projectsService.createProject(this.selectedType, this.buildFormData()).subscribe({
      next: () => this.router.navigateByUrl('/projects'),
      error: err => { this.submitting = false; this.submitError = 'Failed to publish. Please try again.'; console.error(err); },
    });
  }
}
