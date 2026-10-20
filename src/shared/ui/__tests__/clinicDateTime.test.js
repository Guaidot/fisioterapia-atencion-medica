import { describe, expect, it } from 'vitest';
import {
  clinicDateTimeToIso,
  formatClinicDateTime,
} from '../clinicDateTime.js';

describe('clinicDateTime', () => {
  it('converts clinic-local date and time to an instant and formats it back', () => {
    const instant = clinicDateTimeToIso('2026-10-20T13:10');

    expect(instant).toBe('2026-10-20T17:10:00.000Z');
    expect(formatClinicDateTime(instant)).toBe('2026-10-20T13:10');
  });

  it('rejects impossible calendar dates', () => {
    expect(() => clinicDateTimeToIso('2026-02-30T12:00')).toThrow(
      'La fecha y hora de medición no son válidas.',
    );
  });
});
