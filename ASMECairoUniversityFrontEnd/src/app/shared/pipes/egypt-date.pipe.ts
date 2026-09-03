import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { EGYPT_TIME_ZONE } from '../../core/utils/egypt-time.util';

const DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  mediumDate: { dateStyle: 'medium' },
  fullDate: { dateStyle: 'full' },
  shortTime: { timeStyle: 'short' },
  medium: { dateStyle: 'medium', timeStyle: 'medium' },
  short: { dateStyle: 'short', timeStyle: 'short' },
  'EEEE, MMMM d, y': { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
};

/** Formats every displayed timestamp in the application's Africa/Cairo business timezone. */
@Pipe({ name: 'egyptDate', standalone: true })
export class EgyptDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: string | number | Date | null | undefined, format = 'mediumDate'): string | null {
    if (value == null || value === '') return null;

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    const options = DATE_FORMATS[format] ?? DATE_FORMATS['mediumDate'];

    return new Intl.DateTimeFormat(this.locale, {
      ...options,
      timeZone: EGYPT_TIME_ZONE
    }).format(date);
  }
}