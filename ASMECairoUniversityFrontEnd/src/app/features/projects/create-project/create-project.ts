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
import { AdminNavComponent, AdminNavSection } from '../../../shared/components/admin-nav/admin-nav';

/** Local form shapes add transient upload state (photoFile/photoPreview/removePhoto) on top of
 *  the API's Speaker/Partner/Sponsor/Instructor shapes — see handover §5.1/§5.2 for why photos
 *  are matched to these arrays by index rather than carried as structured JSON. */
interface SpeakerForm extends Speaker { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface PartnerForm extends Partner { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface SponsorForm extends Sponsor { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }
interface InstructorForm extends Instructor { photoFile: File | null; photoPreview: string | null; removePhoto: boolean }

type PhotoEntry = { photoFile: File | null; photoPreview: string | null; removePhoto: boolean };

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
  galleryFiles: File[] = []; // newly added gallery images only — existing ones live in existingGalleryImages
  galleryPreviews: string[] = [];
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
    const { date, time } = this.isoToLocalParts(project.mainDateAndTime);
    this.date = date;
    this.time = time;

    this.coverPreview = project.coverImageUrl || null;
    this.coverImage = null;

    this.existingGalleryImages = project.galleryImages;
    this.galleryIdsToKeep = new Set(project.galleryImages.map(g => g.id));
    this.galleryFiles = [];
    this.galleryPreviews = [];

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
    // Date-only fields (no time picker for these two) — see buildFormData()'s comment on why
    // these round-trip through the UTC calendar date rather than the local one.
    this.startDate = this.isoToDateOnlyUTC(p.startDate);
    this.endDate = this.isoToDateOnlyUTC(p.endDate);
    this.numberOfSessions = p.numberOfSessions;
    this.instructors = p.instructors.map(i => ({ ...i, photoFile: null, photoPreview: i.profileImagePath ?? null, removePhoto: false }));
  }

  private populateFieldTrip(p: FieldTripProject): void {
    this.destinationName = p.destinationName;
    this.departureTime = this.isoToDateTimeLocal(p.departureTime);
    this.returnTime = this.isoToDateTimeLocal(p.returnTime);
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
  // mainDateAndTime/departureTime/returnTime round-trip through the browser's LOCAL time,
  // matching how buildFormData() below builds `${date}T${time}` (no timezone suffix, so the
  // browser parses/serializes it as local) before calling .toISOString().
  private isoToLocalParts(iso: string | null | undefined): { date: string; time: string } {
    if (!iso) return { date: '', time: '' };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }
  private isoToDateTimeLocal(iso: string | null | undefined): string {
    const { date, time } = this.isoToLocalParts(iso);
    return date ? `${date}T${time}` : '';
  }
  // startDate/endDate are submitted as bare 'yyyy-MM-dd' (see buildFormData), which JS parses as
  // UTC midnight (date-only strings are a special case in the ECMA-262 Date spec) — so on load,
  // pull the UTC calendar date back out rather than the local one, or the value could shift by a
  // day for anyone west/east of UTC.
  private isoToDateOnlyUTC(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toISOString().substring(0, 10);
  }

  get requiredRemaining(): number {
    let missing = 0;
    if (!this.title.trim()) missing++;
    if (!this.shortDescription.trim()) missing++;
    if (!this.date) missing++;
    if (!this.location.trim()) missing++;
    if (this.mode === 'create' && !this.coverImage) missing++; // required on create, optional on update
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
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.galleryFiles.push(...files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.galleryPreviews.push(e.target?.result as string);
        this.cdr.detectChanges(); // add this
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number): void {
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
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
    fd.append('MainDateAndTime', new Date(`${this.date}T${this.time || '00:00'}`).toISOString());
    if (this.coverImage) fd.append('CoverImage', this.coverImage); // omitted on update = keep current cover

    if (this.mode === 'edit') {
      this.galleryIdsToKeep.forEach(id => fd.append('GalleryImageIdsToKeep', String(id)));
      this.galleryFiles.forEach((file, i) => {
        fd.append('NewGalleryImages', file);
        fd.append('NewGalleryImagesOrder', String(i));
      });
    } else {
      this.galleryFiles.forEach((file, i) => {
        fd.append('GalleryImages', file);
        fd.append('GalleryImagesOrder', String(i));
      });
    }
    return fd;
  }

  /** Appends one photo per entry, in the same order as the JSON array it corresponds to — an
   *  empty File for any entry with no photo, so indices between the JSON array and the photo
   *  file list never drift out of alignment (see handover §5.1). */
  private appendPersonPhotos(fd: FormData, fieldName: string, entries: PhotoEntry[]): void {
    entries.forEach(entry => fd.append(fieldName, entry.photoFile ?? new File([], '')));
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
        this.appendPersonPhotos(fd, 'SpeakerPhotos', validSpeakers);

        const validSponsors = this.sponsors.filter(s => s.name.trim());
        fd.append('Sponsors', JSON.stringify(validSponsors.map(s => ({
          id: s.id, name: s.name, sponsorshipTier: s.sponsorshipTier, removePhoto: s.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'SponsorPhotos', validSponsors);

        const validPartners = this.partners.filter(p => p.name.trim());
        fd.append('Partners', JSON.stringify(validPartners.map(p => ({
          id: p.id, name: p.name, partnerType: p.partnerType, isMainPartner: p.isMainPartner, removePhoto: p.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'PartnerPhotos', validPartners);
        break;
      }

      case ProjectType.Workshop: {
        if (this.startDate) fd.append('StartDate', new Date(this.startDate).toISOString());
        if (this.endDate) fd.append('EndDate', new Date(this.endDate).toISOString());
        if (this.numberOfSessions != null) fd.append('NumberOfSessions', String(this.numberOfSessions));

        const validInstructors = this.instructors.filter(i => i.fullName.trim());
        fd.append('Instructors', JSON.stringify(validInstructors.map(i => ({
          id: i.id, fullName: i.fullName, title: i.title, bio: i.bio, specialization: i.specialization,
          email: i.email, linkedInUrl: i.linkedInUrl || null, removePhoto: i.removePhoto,
        }))));
        this.appendPersonPhotos(fd, 'InstructorPhotos', validInstructors);
        break;
      }

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
