import { describe, expect, it } from 'vitest';

import { currentYear } from '@/lib/footer-utils/current-year';

describe('currentYear', () => {
  it('returns 2024 when called with a Date inside the year 2024 (local components)', () => {
    const fixedDate = new Date(2024, 5, 15, 12, 0);
    expect(currentYear(fixedDate)).toBe(2024);
  });

  it('returns 2026 when called with the first instant of 2026 (local components)', () => {
    const newYear2026 = new Date(2026, 0, 1, 0, 0);
    expect(currentYear(newYear2026)).toBe(2026);
  });

  it('returns 2030 when called with the last instant of 2030 (local components)', () => {
    const newYearsEve2030 = new Date(2030, 11, 31, 23, 59);
    expect(currentYear(newYearsEve2030)).toBe(2030);
  });

  it('uses the current Date when called without arguments and returns a year >= 2026', () => {
    const observedYear = currentYear();
    expect(observedYear).toBeGreaterThanOrEqual(2026);
  });
});
