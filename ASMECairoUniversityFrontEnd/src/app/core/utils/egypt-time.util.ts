/** The application's business timezone, independent of the visitor's device timezone. */
export const EGYPT_TIME_ZONE = 'Africa/Cairo';

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const egyptDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: EGYPT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function egyptParts(date: Date): DateTimeParts {
  const parts = egyptDateTimeFormatter.formatToParts(date);
  const valueOf = (type: string): number =>
    Number(parts.find(part => part.type === type)?.value);

  return {
    year: valueOf('year'),
    month: valueOf('month'),
    day: valueOf('day'),
    hour: valueOf('hour'),
    minute: valueOf('minute'),
    second: valueOf('second'),
  };
}

function egyptUtcOffsetMilliseconds(date: Date): number {
  const parts = egyptParts(date);
  const roundedToSecond = date.getTime() - (date.getTime() % 1000);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    - roundedToSecond;
}

/** Formats an instant for a `datetime-local` control using Egypt's wall-clock time. */
export function toEgyptDateTimeInput(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const parts = egyptParts(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Formats an instant for a date-only control using Egypt's calendar date. */
export function toEgyptDateInput(isoString?: string | null): string {
  const input = toEgyptDateTimeInput(isoString);
  return input ? input.slice(0, 10) : '';
}

/**
 * Converts a datetime-local value into the API DateTime format.
 *
 * The backend uses C# DateTime and the application's business timezone
 * is Egypt, so we deliberately send the Egypt wall-clock value without
 * a UTC "Z" suffix or timezone offset.
 *
 * Example:
 * 2026-09-03T03:19 -> 2026-09-03T03:19:00
 */
export function toEgyptIsoDateTime(inputValue?: string | null): string | null {
  if (!inputValue || !inputValue.trim()) return null;

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      inputValue.trim()
    );

  if (!match) return null;

  const [, year, month, day, hour, minute, second = '00'] = match;

  // Validate the entered date without involving the browser's timezone.
  const validationDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );

  if (
    validationDate.getUTCFullYear() !== Number(year) ||
    validationDate.getUTCMonth() + 1 !== Number(month) ||
    validationDate.getUTCDate() !== Number(day) ||
    validationDate.getUTCHours() !== Number(hour) ||
    validationDate.getUTCMinutes() !== Number(minute) ||
    validationDate.getUTCSeconds() !== Number(second)
  ) {
    return null;
  }

  // IMPORTANT:
  // Do NOT call .toISOString() here.
  // We want the exact Egypt wall-clock value.
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/** Converts an Egypt calendar date to the ISO instant at Egypt midnight. */
export function egyptDateToIso(inputValue?: string | null): string | null {
  return inputValue ? toEgyptIsoDateTime(`${inputValue}T00:00`) : null;
}
