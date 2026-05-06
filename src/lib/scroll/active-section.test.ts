import { describe, expect, it } from 'vitest';

import { pickActiveSection, type SectionVisibility } from './active-section';

const baseEntry = (overrides: Partial<SectionVisibility>): SectionVisibility => ({
  id: 'why',
  isIntersecting: false,
  intersectionRatio: 0,
  ...overrides,
});

describe('pickActiveSection', () => {
  it('returns the only intersecting section when exactly one is visible', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'why', isIntersecting: true, intersectionRatio: 0.4 }),
      baseEntry({ id: 'how', isIntersecting: false, intersectionRatio: 0 }),
      baseEntry({ id: 'what', isIntersecting: false, intersectionRatio: 0 }),
    ];
    expect(pickActiveSection(entries, null)).toBe('why');
  });

  it('returns the section with the highest intersectionRatio when several intersect', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'why', isIntersecting: true, intersectionRatio: 0.2 }),
      baseEntry({ id: 'how', isIntersecting: true, intersectionRatio: 0.7 }),
      baseEntry({ id: 'what', isIntersecting: true, intersectionRatio: 0.5 }),
    ];
    expect(pickActiveSection(entries, null)).toBe('how');
  });

  it('breaks ratio ties by document order (first declared wins)', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'how', isIntersecting: true, intersectionRatio: 0.5 }),
      baseEntry({ id: 'what', isIntersecting: true, intersectionRatio: 0.5 }),
    ];
    expect(pickActiveSection(entries, null)).toBe('how');
  });

  it('falls back to the previous active id when no section currently intersects', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'why', isIntersecting: false, intersectionRatio: 0 }),
      baseEntry({ id: 'how', isIntersecting: false, intersectionRatio: 0 }),
    ];
    expect(pickActiveSection(entries, 'how')).toBe('how');
  });

  it('returns null when no section intersects and there is no previous active', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'why', isIntersecting: false, intersectionRatio: 0 }),
      baseEntry({ id: 'how', isIntersecting: false, intersectionRatio: 0 }),
    ];
    expect(pickActiveSection(entries, null)).toBeNull();
  });

  it('returns null on empty input regardless of previous active', () => {
    expect(pickActiveSection([], null)).toBeNull();
    expect(pickActiveSection([], 'why')).toBeNull();
  });

  it('treats isIntersecting=true with ratio 0 as visible (e.g. just-touching boundary)', () => {
    const entries: ReadonlyArray<SectionVisibility> = [
      baseEntry({ id: 'why', isIntersecting: true, intersectionRatio: 0 }),
    ];
    expect(pickActiveSection(entries, null)).toBe('why');
  });
});
