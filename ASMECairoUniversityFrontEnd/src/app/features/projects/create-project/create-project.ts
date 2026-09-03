import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { ProjectsService } from '../../../core/services/projects.service';
import {
  Project, ProjectType, Speaker, Partner, Sponsor, SponsorshipTier, Instructor, GalleryImage,
  EventProject, WorkshopProject, FieldTripProject, SchoolVisitProject,
} from '../../../core/models/project.model';
import { ALL_PROJECT_TYPES, projectTypeIcon, projectTypeLabel } from '../../../core/utils/project-route.util';
import { egyptDateToIso, toEgyptDateInput, toEgyptDateTimeInput, toEgyptIsoDateTime } from '../../../core/utils/egypt-time.util';
import { AdminNavComponent, AdminNavSection } from '../../../shared/components/admin-nav/admin-nav';

/** Local form shapes add transient upload state (photoFile/photoPreview/removePhoto) on top of
 *  the API's Speaker/Partner/Sponsor/Instructor shapes. New files are accompanied by their
 *  entry index in the multipart payload so omitted files cannot shift onto another person. */
interface SpeakerForm extends Speaker { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface PartnerForm extends Partner { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface SponsorForm extends Sponsor { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface InstructorForm extends Instructor { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }

type PhotoEntry = { photoFile: File | null; photoPreview: string | null; removePhoto: boolean };
type GalleryUpload = { file: File; preview: string | null };

const blankSpeaker = (): SpeakerForm => ({ id: null, name: '', title: '', shortBio: '', photoUrl: null, photoFile: null, photoPreview: null, removePhoto: false });
const blankPartner = (): PartnerForm => ({ id: null, name: '', partnerType: '', isMainPartner: false, photoUrl: null, photoFile: null, photoPreview: null, removePhoto: false });
const blankSponsor = (): SponsorForm => ({ id: null, name: '', sponsorshipTier: SponsorshipTier.Gold, photoUrl: null, photoFile: null, photoPreview: null, removePhoto: false });
const blankInstructor = (): InstructorForm => ({ id: null, fullName: '', title: '', bio: '', specialization: '', email: '', linkedInUrl: '', profileImagePath: null, photoFile: null, photoPreview: null, removePhoto: false });

/**
 * Doubles as both the create form (/admin/create-project) and the edit form
 * (/admin/update-project/:id) — same fields, same validation, same layout. Edit mode is driven
 * entirely by whether the route has an `:id` param: if it does, the existing project is fetched
 * and used to populate every field, the project type becomes locked (the API's update endpoint
 * is itself type-specific — see handover §4 — a project can't change type), and submit calls
 * ProjectsService.updateProject() instead of createProject().
 */
@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownComponent, AdminNavComponent],
  templateUrl: './create-project.html',
  styleUrls: ['./create-project.css', '../../../shared/styles/markdown-body.css'],
})
export class CreateProjectComponent implements OnInit {
  readonly ProjectType = ProjectType;
  readonly SponsorshipTier = SponsorshipTier;
  readonly types = ALL_PROJECT_TYPES;
  readonly educationalStageSuggestions = ['Primary', 'Preparatory', 'Secondary'];

  readonly projectTypeIcon = projectTypeIcon;
  readonly projectTypeLabel = projectTypeLabel;

  // ── Mode ──
  mode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  loadingProject = false;
  loadError = '';

  get navSection(): AdminNavSection {
    return this.mode === 'edit' ? 'edit' : 'create';
  }

  // ── Type selection ──
  selectedType: ProjectType = ProjectType.Event;

  // ── Common fields ──
  title = '';
  shortDescription = '';
  longDescription = '';
  descriptionView: 'write' | 'preview' = 'write';
  location = '';
  date = ''; // yyyy-mm-dd
  time = ''; // HH:mm
  coverImage: File | null = null;
  coverPreview: string | null = null; // data URL for a newly-picked file, or the existing cover URL in edit mode
  isDragOver = false;
  /** New gallery files and their previews stay paired so an asynchronous FileReader cannot
   * reorder the preview list relative to the multipart payload. */
  galleryUploads: GalleryUpload[] = [];
  galleryError = '';
  existingGalleryImages: GalleryImage[] = [];
  galleryIdsToKeep = new Set<number>();

  // ── Event fields ──
  ticketPrice: number | undefined;
  scheduleNotes = '';
  comment = '';
  speakers: SpeakerForm[] = [];
  partners: PartnerForm[] = [];
  sponsors: SponsorForm[] = [];

  activeTab: 'speakers' | 'partners' | 'sponsors' = 'speakers';

  // ── Workshop fields ──
  startDate = '';
  endDate = '';
  numberOfSessions: number | undefined;
  instructors: InstructorForm[] = [];

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

  // ── SchoolVisit fields ──
  schoolName = '';
  educationalStage = '';
  numberOfStudents: number | undefined;
  contactPersonName = '';
  contactPersonPhone = '';
  objective = '';

  submitting = false;
  submitError = '';

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Subscribed (not just read once) so navigating from one edit page straight to another
    // (e.g. Edit on one card, then Edit on a different card) re-runs this even though Angular
    // may reuse the component instance since only the :id param changed.
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.mode = 'edit';
        this.editingId = id;
        this.loadForEdit(id);
      } else {
        this.mode = 'create';
        this.editingId = null;
      }
    });
  }

  private loadForEdit(id: string): void {
    this.loadingProject = true;
    this.loadError = '';
    this.projectsService.getById(id).subscribe({
      next: project => {
        this.populateFromProject(project);
        this.loadingProject = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = "Couldn't load this project — it may have been deleted.";
        this.loadingProject = false;
        this.cdr.detectChanges();
      },
    });
  }

  private populateFromProject(project: Project): void {
    this.selectedType = project.type;
    this.title = project.title;
    this.shortDescription = project.shortDescription;
    this.longDescription = project.longDescription;
    this.location = project.location;
    const { date, time } = this.isoToEgyptParts(project.mainDateAndTime);
    this.date = date;
    this.time = time;

    this.coverPreview = project.coverImageUrl || null;
    this.coverImage = null;

    this.existingGalleryImages = project.galleryImages;
    this.galleryIdsToKeep = new Set(project.galleryImages.map(g => g.id));
    this.galleryUploads = [];
    this.galleryError = '';

    switch (project.type) {
      case ProjectType.Event:
        this.populateEvent(project);
        break;
      case ProjectType.Workshop:
        this.populateWorkshop(project);
        break;
      case ProjectType.FieldTrip:
        this.populateFieldTrip(project);
        break;
      case ProjectType.SchoolVisit:
        this.populateSchoolVisit(project);
        break;
    }
  }

  private populateEvent(p: EventProject): void {
    this.ticketPrice = p.ticketPrice;
    this.scheduleNotes = p.scheduleNotes;
    this.comment = p.comment;
    this.speakers = p.speakers.map(s => ({ ...s, photoFile: null, photoPreview: s.photoUrl ?? null, removePhoto: false }));
    this.partners = p.partners.map(pt => ({ ...pt, photoFile: null, photoPreview: pt.photoUrl ?? null, removePhoto: false }));
    this.sponsors = p.sponsors.map(s => ({ ...s, photoFile: null, photoPreview: s.photoUrl ?? null, removePhoto: false }));
  }

  private populateWorkshop(p: WorkshopProject): void {
    // Date-only fields (no time picker for these two).
    // They use Egypt's calendar date when loading and submitting.
    this.startDate = toEgyptDateInput(p.startDate);
    this.endDate = toEgyptDateInput(p.endDate);
    this.numberOfSessions = p.numberOfSessions;
    this.instructors = p.instructors.map(i => ({ ...i, photoFile: null, photoPreview: i.profileImagePath ?? null, removePhoto: false }));
  }

  private populateFieldTrip(p: FieldTripProject): void {
    this.destinationName = p.destinationName;
    this.departureTime = toEgyptDateTimeInput(p.departureTime);
    this.returnTime = toEgyptDateTimeInput(p.returnTime);
    this.meetingPoint = p.meetingPoint;
    this.transportationDetails = p.transportationDetails;
    this.capacity = p.capacity ?? undefined;
    this.price = p.price ?? undefined;
    this.registrationUrl = p.registrationUrl;
    this.requirements = p.requirements;
    this.notes = p.notes;
  }

  private populateSchoolVisit(p: SchoolVisitProject): void {
    this.schoolName = p.schoolName;
    this.educationalStage = p.educationalStage;
    this.numberOfStudents = p.numberOfStudents ?? undefined;
    this.contactPersonName = p.contactPersonName;
    this.contactPersonPhone = p.contactPersonPhone;
    this.objective = p.objective;
    this.requirements = p.requirements;
    this.notes = p.notes;
  }

  // ── Date helpers ──
  // Project form inputs always show and submit Egypt wall-clock time.
  private isoToEgyptParts(iso: string | null | undefined): { date: string; time: string } {
    const input = toEgyptDateTimeInput(iso);
    return input ? { date: input.slice(0, 10), time: input.slice(11) } : { date: '', time: '' };
  }
  get requiredRemaining(): number {
    let missing = 0;
    if (!this.title.trim()) missing++;
    if (!this.shortDescription.trim()) missing++;
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
    reader.onload = e => {
      this.coverPreview = e.target?.result as string;
      this.cdr.detectChanges(); // add this
    };
    reader.readAsDataURL(file);
  }

  // ── Gallery images ──
  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const validFiles = files.filter(file => file.type === 'image/png' || file.type === 'image/jpeg');
    const validSizeFiles = validFiles.filter(file => file.size <= 5 * 1024 * 1024);
    const rejectedType = files.length - validFiles.length;
    const rejectedSize = validFiles.length - validSizeFiles.length;

    this.galleryError = rejectedType || rejectedSize
      ? 'Only PNG or JPEG images under 5 MB can be added to the gallery.'
      : '';

    validSizeFiles.forEach(file => {
      const upload: GalleryUpload = { file, preview: null };
      this.galleryUploads.push(upload);
      const reader = new FileReader();
      reader.onload = e => {
        upload.preview = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });

    // Allow selecting the same file again after removing it.
    input.value = '';
  }

  removeGalleryImage(index: number): void {
    this.galleryUploads.splice(index, 1);
  }

  /** Edit mode only — drops an existing gallery image from the "keep" list. The image (and its
   *  file) is deleted server-side once the id is missing from GalleryImageIdsToKeep on submit. */
  removeExistingGalleryImage(id: number): void {
    this.galleryIdsToKeep.delete(id);
  }

  restoreExistingGalleryImage(id: number): void {
    this.galleryIdsToKeep.add(id);
  }

  // ── Photo upload (speakers / partners / sponsors / instructors) ──
  setPersonPhoto(entry: PhotoEntry, file: File | null): void {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return; }
    entry.photoFile = file;
    entry.removePhoto = false;
    const reader = new FileReader();
    reader.onload = e => {
      entry.photoPreview = e.target?.result as string;
      this.cdr.detectChanges(); // add this
    };
    reader.readAsDataURL(file);
  }
  clearPersonPhoto(entry: PhotoEntry): void {
    entry.photoFile = null;
    entry.photoPreview = null;
    entry.removePhoto = true;
  }

  addSpeaker(): void { this.speakers = [...this.speakers, blankSpeaker()]; }
  removeSpeaker(i: number): void { this.speakers = this.speakers.filter((_, idx) => idx !== i); }

  addPartner(): void { this.partners = [...this.partners, blankPartner()]; }
  removePartner(i: number): void { this.partners = this.partners.filter((_, idx) => idx !== i); }

  addSponsor(): void { this.sponsors = [...this.sponsors, blankSponsor()]; }
  removeSponsor(i: number): void { this.sponsors = this.sponsors.filter((_, idx) => idx !== i); }

  addInstructor(): void { this.instructors = [...this.instructors, blankInstructor()]; }
  removeInstructor(i: number): void { this.instructors = this.instructors.filter((_, idx) => idx !== i); }

  private buildCommonFormData(): FormData {
    const fd = new FormData();
    fd.append('Title', this.title);
    fd.append('ShortDescription', this.shortDescription);
    fd.append('LongDescription', this.longDescription);
    fd.append('Location', this.location);
    if (this.date) {
      const mainDateAndTime = toEgyptIsoDateTime(`${this.date}T${this.time || '00:00'}`);
      if (mainDateAndTime) fd.append('MainDateAndTime', mainDateAndTime);
    }
    if (this.coverImage) fd.append('CoverImage', this.coverImage);

    if (this.mode === 'edit') {
      this.galleryIdsToKeep.forEach(id => fd.append('GalleryImageIdsToKeep', String(id)));
      this.galleryUploads.forEach((upload, i) => {
        fd.append('NewGalleryImages', upload.file);
        fd.append('NewGalleryImagesOrder', String(i));
      });
    } else {
      this.galleryUploads.forEach((upload, i) => {
        fd.append('GalleryImages', upload.file);
        fd.append('GalleryImagesOrder', String(i));
      });
    }
    return fd;
  }

  /** Sends only real files and pairs each one with its JSON-array index. Empty multipart files
   *  are not reliable placeholders because browsers/ASP.NET may omit them during binding. */
  private appendPersonPhotos(
    fd: FormData,
    fieldName: string,
    indexFieldName: string,
    entries: PhotoEntry[],
  ): void {
    entries.forEach((entry, index) => {
      if (!entry.photoFile) return;
      fd.append(fieldName, entry.photoFile);
      fd.append(indexFieldName, String(index));
    });
  }

  private buildFormData(): FormData {
    const fd = this.buildCommonFormData();

    switch (this.selectedType) {
      case ProjectType.Event: {
        if (this.ticketPrice != null) fd.append('TicketPrice', String(this.ticketPrice));
        fd.append('ScheduleNotes', this.scheduleNotes);
        fd.append('Comment', this.comment);

        const validSpeakers = this.speakers.filter(s => s.name.trim());
        fd.append('Speakers', JSON.stringify(validSpeakers.map(s => ({
          id: s.id, name: s.name, title: s.title, shortBio: s.shortBio, removePhoto: s.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'SpeakerPhotos', 'SpeakerPhotoIndexes', validSpeakers);

        const validSponsors = this.sponsors.filter(s => s.name.trim());
        fd.append('Sponsors', JSON.stringify(validSponsors.map(s => ({
          id: s.id, name: s.name, sponsorshipTier: s.sponsorshipTier, removePhoto: s.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'SponsorPhotos', 'SponsorPhotoIndexes', validSponsors);

        const validPartners = this.partners.filter(p => p.name.trim());
        fd.append('Partners', JSON.stringify(validPartners.map(p => ({
          id: p.id, name: p.name, partnerType: p.partnerType, isMainPartner: p.isMainPartner, removePhoto: p.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'PartnerPhotos', 'PartnerPhotoIndexes', validPartners);
        break;
      }

      case ProjectType.Workshop: {
        const startDate = egyptDateToIso(this.startDate);
        const endDate = egyptDateToIso(this.endDate);
        if (startDate) fd.append('StartDate', startDate);
        if (endDate) fd.append('EndDate', endDate);
        if (this.numberOfSessions != null) fd.append('NumberOfSessions', String(this.numberOfSessions));

        const validInstructors = this.instructors.filter(i => i.fullName.trim());
        fd.append('Instructors', JSON.stringify(validInstructors.map(i => ({
          id: i.id, fullName: i.fullName, title: i.title, bio: i.bio, specialization: i.specialization,
          email: i.email, linkedInUrl: i.linkedInUrl || null, removePhoto: i.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'InstructorPhotos', 'InstructorPhotoIndexes', validInstructors);
        break;
      }

      case ProjectType.FieldTrip:
        fd.append('DestinationName', this.destinationName);
        const departureTime = toEgyptIsoDateTime(this.departureTime);
        const returnTime = toEgyptIsoDateTime(this.returnTime);
        if (departureTime) fd.append('DepartureTime', departureTime);
        if (returnTime) fd.append('ReturnTime', returnTime);
        fd.append('MeetingPoint', this.meetingPoint);
        fd.append('TransportationDetails', this.transportationDetails);
        if (this.capacity != null) fd.append('Capacity', String(this.capacity));
        if (this.price != null) fd.append('Price', String(this.price));
        fd.append('RegistrationUrl', this.registrationUrl);
        fd.append('Requirements', this.requirements);
        fd.append('Notes', this.notes);
        break;

      case ProjectType.SchoolVisit:
        fd.append('SchoolName', this.schoolName);
        fd.append('EducationalStage', this.educationalStage);
        if (this.numberOfStudents != null) fd.append('NumberOfStudents', String(this.numberOfStudents));
        fd.append('ContactPersonName', this.contactPersonName);
        fd.append('ContactPersonPhone', this.contactPersonPhone);
        fd.append('Objective', this.objective);
        fd.append('Requirements', this.requirements);
        fd.append('Notes', this.notes);
        break;
    }

    return fd;
  }

  onPublish(): void {
    if (this.requiredRemaining > 0) return;
    this.submitting = true;
    this.submitError = '';

    const request = this.mode === 'edit' && this.editingId
      ? this.projectsService.updateProject(this.selectedType, this.editingId, this.buildFormData())
      : this.projectsService.createProject(this.selectedType, this.buildFormData());

    request.subscribe({
      next: () => this.router.navigateByUrl('/admin/projects'),
      error: err => {
        this.submitting = false;
        this.submitError = this.mode === 'edit' ? 'Failed to save changes. Please try again.' : 'Failed to publish. Please try again.';
        console.error(err);
        this.cdr.detectChanges(); // add this
      },
    });
  }
}
