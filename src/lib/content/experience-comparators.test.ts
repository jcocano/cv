import { describe, expect, it } from 'vitest';

import {
  compareByOrderAsc,
  compareCurrentRolesFirst,
  compareFinishedByDateEndDesc,
} from '@/lib/content/experience-comparators';
import type { SortableExperience } from '@/lib/content/sort-by-date-desc';

function makeItem(
  overrides: Partial<SortableExperience> & { company: string },
): SortableExperience {
  return {
    company: overrides.company,
    dateStart: overrides.dateStart ?? '2020-01',
    dateEnd: overrides.dateEnd ?? null,
    order: overrides.order ?? 0,
  };
}

describe('compareCurrentRolesFirst', () => {
  it('returns a negative number when a is current (dateEnd === null) and b is finished', () => {
    const a = makeItem({ company: 'a', dateEnd: null });
    const b = makeItem({ company: 'b', dateEnd: '2024-01' });
    expect(compareCurrentRolesFirst(a, b)).toBeLessThan(0);
  });

  it('returns a positive number when a is finished and b is current', () => {
    const a = makeItem({ company: 'a', dateEnd: '2024-01' });
    const b = makeItem({ company: 'b', dateEnd: null });
    expect(compareCurrentRolesFirst(a, b)).toBeGreaterThan(0);
  });

  it('returns 0 when both are current', () => {
    const a = makeItem({ company: 'a', dateEnd: null });
    const b = makeItem({ company: 'b', dateEnd: null });
    expect(compareCurrentRolesFirst(a, b)).toBe(0);
  });

  it('returns 0 when both are finished (regardless of dateEnd value)', () => {
    const a = makeItem({ company: 'a', dateEnd: '2024-01' });
    const b = makeItem({ company: 'b', dateEnd: '2020-01' });
    expect(compareCurrentRolesFirst(a, b)).toBe(0);
  });
});

describe('compareFinishedByDateEndDesc', () => {
  it('returns a negative number when a.dateEnd is later than b.dateEnd', () => {
    const a = makeItem({ company: 'a', dateEnd: '2024-12' });
    const b = makeItem({ company: 'b', dateEnd: '2020-01' });
    expect(compareFinishedByDateEndDesc(a, b)).toBeLessThan(0);
  });

  it('returns a positive number when a.dateEnd is earlier than b.dateEnd', () => {
    const a = makeItem({ company: 'a', dateEnd: '2020-01' });
    const b = makeItem({ company: 'b', dateEnd: '2024-12' });
    expect(compareFinishedByDateEndDesc(a, b)).toBeGreaterThan(0);
  });

  it('returns 0 when both have the same dateEnd', () => {
    const a = makeItem({ company: 'a', dateEnd: '2022-06' });
    const b = makeItem({ company: 'b', dateEnd: '2022-06' });
    expect(compareFinishedByDateEndDesc(a, b)).toBe(0);
  });

  it('returns 0 when either dateEnd is null (callers must filter current roles first via compareCurrentRolesFirst)', () => {
    const aNull = makeItem({ company: 'a', dateEnd: null });
    const bFinished = makeItem({ company: 'b', dateEnd: '2024-01' });
    expect(compareFinishedByDateEndDesc(aNull, bFinished)).toBe(0);
    expect(compareFinishedByDateEndDesc(bFinished, aNull)).toBe(0);
    const bothNull = makeItem({ company: 'c', dateEnd: null });
    expect(compareFinishedByDateEndDesc(aNull, bothNull)).toBe(0);
  });
});

describe('compareByOrderAsc', () => {
  it('returns a negative number when a.order < b.order', () => {
    const a = makeItem({ company: 'a', order: 1 });
    const b = makeItem({ company: 'b', order: 5 });
    expect(compareByOrderAsc(a, b)).toBeLessThan(0);
  });

  it('returns a positive number when a.order > b.order', () => {
    const a = makeItem({ company: 'a', order: 9 });
    const b = makeItem({ company: 'b', order: 2 });
    expect(compareByOrderAsc(a, b)).toBeGreaterThan(0);
  });

  it('returns 0 when both have the same order', () => {
    const a = makeItem({ company: 'a', order: 3 });
    const b = makeItem({ company: 'b', order: 3 });
    expect(compareByOrderAsc(a, b)).toBe(0);
  });
});
