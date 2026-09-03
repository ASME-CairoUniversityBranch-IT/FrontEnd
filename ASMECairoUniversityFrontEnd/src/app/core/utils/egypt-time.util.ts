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
 * Converts a `datetime-local` value interpreted in Egypt time to the UTC ISO instant expected by
 * the API. This deliberately does not use the visitor's browser timezone.
 */
export function toEgyptIsoDateTime(inputValue?: string | null): string | null {
  if (!inputValue || !inputValue.trim()) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(inputValue);
  if (!match) return null;

  const [year, month, day, hour, minute, second = '0', milliseconds = '0'] = match.slice(1);
  const expected = {
    year: Number(year), month: Number(month), day: Number(day), hour: Number(hour),
    minute: Number(minute), second: Number(second),
  };
  const desiredUtcMilliseconds = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
    expected.second,
    Number(milliseconds.padEnd(3, '0')),
  );
  const parsed = new Date(desiredUtcMilliseconds);
  if (
    parsed.getUTCFullYear() !== expected.year || parsed.getUTCMonth() + 1 !== expected.month
    || parsed.getUTCDate() !== expected.day || parsed.getUTCHours() !== expected.hour
    || parsed.getUTCMinutes() !== expected.minute || parsed.getUTCSeconds() !== expected.second
  ) return null;

  // The offset changes with Egypt's daylight saving time. Re-evaluate it until it stabilizes.
  let instantMilliseconds = desiredUtcMilliseconds;
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = desiredUtcMilliseconds - egyptUtcOffsetMilliseconds(new Date(instantMilliseconds));
    if (next === instantMilliseconds) break;
    instantMilliseconds = next;
  }

  const resolved = new Date(instantMilliseconds);
  const resolvedParts = egyptParts(resolved);
  if (
    resolvedParts.year !== expected.year || resolvedParts.month !== expected.month
    || resolvedParts.day !== expected.day || resolvedParts.hour !== expected.hour
    || resolvedParts.minute !== expected.minute || resolvedParts.second !== expected.second
  ) return null;

  return resolved.toISOString();
}

/** Converts an Egypt calendar date to the ISO instant at Egypt midnight. */
export function egyptDateToIso(inputValue?: string | null): string | null {
  return inputValue ? toEgyptIsoDateTime(`${inputValue}T00:00`) : null;
}
