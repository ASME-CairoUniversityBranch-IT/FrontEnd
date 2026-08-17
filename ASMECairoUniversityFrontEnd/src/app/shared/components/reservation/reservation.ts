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
  hasStarted = false;

  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges(): void {
    clearInterval(this.timer);

    this.hasStarted = false;
    this.countdownText = '';

    if (this.project?.mainDateAndTime) {
      this.tick();

      // Don't start a timer if the event has already started
      if (!this.hasStarted) {
        this.timer = setInterval(() => this.tick(), 1000);
      }
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  get externalRegistrationUrl(): string | null {
    return this.project?.type === ProjectType.FieldTrip
      ? this.project.registrationUrl || null
      : null;
  }

  onRegister(): void {
    alert('Registration flow not yet available for this project type.');
  }

  onAddToCalendar(): void {
    alert('Opening calendar integrated application...');
  }

  private tick(): void {
    if (!this.project?.mainDateAndTime) {
      return;
    }

    const diff =
      new Date(this.project.mainDateAndTime).getTime() - Date.now();

    if (diff <= 0) {
      this.hasStarted = true;
      this.countdownText = 'Started';
      clearInterval(this.timer);
      return;
    }

    this.hasStarted = false;

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    this.countdownText = `${d}d ${h}h ${m}m`;
  }
}