import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, ProjectType } from '../../../core/models/project.model';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.css'],
})
export class ReservationComponent implements OnChanges, OnDestroy {
  @Input() project: Project | null = null;

  countdownText = '';
  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges(): void {
    clearInterval(this.timer);
    if (this.project?.mainDateAndTime) {
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  get externalRegistrationUrl(): string | null {
    return this.project?.type === ProjectType.FieldTrip ? this.project.registrationUrl || null : null;
  }

  onRegister(): void {
    // No generic registration endpoint exists in the API yet for Events/Workshops/Competitions —
    // wire this up once the backend exposes one. FieldTrips already use `externalRegistrationUrl` above.
    alert('Registration flow not yet available for this project type.');
  }

  onAddToCalendar(): void {
    alert('Opening calendar integrated application...');
  }

  private tick(): void {
    const diff = new Date(this.project!.mainDateAndTime).getTime() - Date.now();
    if (diff <= 0) {
      this.countdownText = 'Started';
      clearInterval(this.timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    this.countdownText = `${d}d ${h}h ${m}m`;
  }
}
