export type EventType = 'event' | 'workshop' | 'field_trip' | 'competition';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Speaker {
  fullName: string;
  role?: string;
  shortBio?: string;
}

export interface Partner {
  name: string;
  role?: string;
}
export interface Committee {
  value: string;
  label: string;
}
export interface EventTypeOption {
  value: EventType;
  label: string;
  emoji: string;
}

export interface Sponsor {
  name: string;
  tier?: string;
}

export interface CreateEventDto {
  eventType: EventType;
  title: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  date: string;
  time?: string;
  location: string;
  organisingCommittee?: string;
  capacity?: number;
  registrationDeadline?: string;
  status: EventStatus;
  tags?: string[];
  coverImage?: File | null;
  speakers?: Speaker[];
  partners?: Partner[];
  sponsors?: Sponsor[];
}
