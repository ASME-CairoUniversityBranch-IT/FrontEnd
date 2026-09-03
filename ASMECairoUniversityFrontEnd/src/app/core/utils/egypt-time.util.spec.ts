import {
  EGYPT_TIME_ZONE,
  egyptDateToIso,
  toEgyptDateTimeInput,
  toEgyptIsoDateTime,
} from './egypt-time.util';

describe('Egypt time utilities', () => {
  it('uses the application timezone instead of the visitor device timezone', () => {
    expect(EGYPT_TIME_ZONE).toBe('Africa/Cairo');
    expect(toEgyptDateTimeInput('2026-01-15T09:30:00.000Z')).toBe('2026-01-15T11:30');
    expect(toEgyptDateTimeInput('2026-07-01T09:30:00.000Z')).toBe('2026-07-01T12:30');
  });

  it('converts Egypt wall-clock input to its UTC API instant across daylight saving time', () => {
    expect(toEgyptIsoDateTime('2026-01-15T11:30')).toBe('2026-01-15T09:30:00.000Z');
    expect(toEgyptIsoDateTime('2026-07-01T12:30')).toBe('2026-07-01T09:30:00.000Z');
    expect(egyptDateToIso('2026-07-01')).toBe('2026-06-30T21:00:00.000Z');
  });
});
