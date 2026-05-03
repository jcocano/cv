import { describe, expect, it } from 'vitest';

import { currentVisibleSection } from '@/lib/motion/scrollspy';

describe('currentVisibleSection', () => {
  it('returns null when the array is empty', () => {
    expect(currentVisibleSection([])).toBeNull();
  });

  it('returns null when every ratio is 0', () => {
    expect(
      currentVisibleSection([
        { id: 'about', ratio: 0 },
        { id: 'work', ratio: 0 },
        { id: 'contact', ratio: 0 },
      ]),
    ).toBeNull();
  });

  it('returns the id when only one entry has ratio greater than 0', () => {
    expect(
      currentVisibleSection([
        { id: 'about', ratio: 0 },
        { id: 'work', ratio: 0.42 },
        { id: 'contact', ratio: 0 },
      ]),
    ).toBe('work');
  });

  it('returns the id with the highest ratio when several entries are visible', () => {
    expect(
      currentVisibleSection([
        { id: 'about', ratio: 0.2 },
        { id: 'work', ratio: 0.6 },
        { id: 'contact', ratio: 0.4 },
      ]),
    ).toBe('work');
  });

  it('returns the first id in document order when there is a tie of ratios (stable)', () => {
    expect(
      currentVisibleSection([
        { id: 'about', ratio: 0.5 },
        { id: 'work', ratio: 0.5 },
        { id: 'contact', ratio: 0.5 },
      ]),
    ).toBe('about');
  });

  it('returns the single id when the array contains exactly one entry with ratio greater than 0', () => {
    expect(currentVisibleSection([{ id: 'work', ratio: 0.01 }])).toBe('work');
  });
});
