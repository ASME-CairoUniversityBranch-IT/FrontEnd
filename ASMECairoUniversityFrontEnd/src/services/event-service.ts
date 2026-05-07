import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEventDto } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly baseUrl = ''; // <-- Set your API base URL here

  constructor(private http: HttpClient) {}

  createEvent(dto: CreateEventDto): Observable<any> {
    const formData = this.buildFormData(dto);
    return this.http.post(`${this.baseUrl}/events`, formData);
  }

  saveDraft(dto: CreateEventDto): Observable<any> {
    const formData = this.buildFormData(dto);
    return this.http.post(`${this.baseUrl}/events/draft`, formData);
  }

  private buildFormData(dto: CreateEventDto): FormData {
    const formData = new FormData();

    formData.append('eventType', dto.eventType);
    formData.append('title', dto.title);
    formData.append('shortDescription', dto.shortDescription);
    formData.append('icon', dto.icon);
    formData.append('date', dto.date);
    formData.append('location', dto.location);
    formData.append('status', dto.status);

    if (dto.time) formData.append('time', dto.time);
    if (dto.organisingCommittee) formData.append('organisingCommittee', dto.organisingCommittee);
    if (dto.capacity != null) formData.append('capacity', String(dto.capacity));
    if (dto.registrationDeadline) formData.append('registrationDeadline', dto.registrationDeadline);
    if (dto.coverImage) formData.append('coverImage', dto.coverImage);

    formData.append('tags', JSON.stringify(dto.tags));
    formData.append('speakers', JSON.stringify(dto.speakers));
    formData.append('partners', JSON.stringify(dto.partners));
    formData.append('sponsors', JSON.stringify(dto.sponsors));

    return formData;
  }
}
