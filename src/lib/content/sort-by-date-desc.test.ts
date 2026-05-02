import { describe, expect, it } from 'vitest';

import { sortByDateDesc, type SortableExperience } from '@/lib/content/sort-by-date-desc';

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

describe('sortByDateDesc', () => {
  it('returns an empty array when given an empty array', () => {
    expect(sortByDateDesc([])).toEqual([]);
  });

  it('orders three items strictly by dateEnd descending when no nulls and unique ends', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'old', dateStart: '2010-01', dateEnd: '2012-01', order: 3 }),
      makeItem({ company: 'mid', dateStart: '2018-01', dateEnd: '2020-01', order: 2 }),
      makeItem({ company: 'new', dateStart: '2022-01', dateEnd: '2024-01', order: 1 }),
    ];
    const sorted = sortByDateDesc(items);
    expect(sorted.map((i) => i.company)).toEqual(['new', 'mid', 'old']);
  });

  it('places the item with dateEnd === null first regardless of its dateStart', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'recent-finished', dateStart: '2024-06', dateEnd: '2025-01', order: 1 }),
      makeItem({ company: 'older-current', dateStart: '2020-03', dateEnd: null, order: 2 }),
      makeItem({ company: 'oldest', dateStart: '2018-01', dateEnd: '2020-03', order: 3 }),
    ];
    const sorted = sortByDateDesc(items);
    expect(sorted[0]?.company).toBe('older-current');
    expect(sorted.map((i) => i.company)).toEqual(['older-current', 'recent-finished', 'oldest']);
  });

  it('breaks dateEnd ties by order ascending', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'b-second', dateStart: '2022-01', dateEnd: '2022-06', order: 5 }),
      makeItem({ company: 'a-first', dateStart: '2022-01', dateEnd: '2022-06', order: 2 }),
      makeItem({ company: 'older', dateStart: '2020-01', dateEnd: '2021-01', order: 9 }),
    ];
    const sorted = sortByDateDesc(items);
    expect(sorted.map((i) => i.company)).toEqual(['a-first', 'b-second', 'older']);
  });

  it('does not mutate the input array', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'a', dateStart: '2010-01', dateEnd: '2012-01', order: 3 }),
      makeItem({ company: 'b', dateStart: '2022-01', dateEnd: '2024-01', order: 1 }),
    ];
    const snapshot = items.map((i) => i.company);
    sortByDateDesc(items);
    expect(items.map((i) => i.company)).toEqual(snapshot);
  });

  it('handles multiple null dateEnd by ordering them by order ascending among themselves', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'current-b', dateStart: '2024-01', dateEnd: null, order: 2 }),
      makeItem({ company: 'current-a', dateStart: '2024-01', dateEnd: null, order: 1 }),
      makeItem({ company: 'finished', dateStart: '2024-06', dateEnd: '2024-12', order: 3 }),
    ];
    const sorted = sortByDateDesc(items);
    expect(sorted.map((i) => i.company)).toEqual(['current-a', 'current-b', 'finished']);
  });

  it('orders the five real CV roles as Yuga > tokenproof > METAONE > Savare > Early', () => {
    const items: SortableExperience[] = [
      makeItem({ company: 'METAONE', dateStart: '2022-03', dateEnd: '2022-09', order: 3 }),
      makeItem({ company: 'Savare Medika', dateStart: '2018-03', dateEnd: '2022-03', order: 4 }),
      makeItem({ company: 'Yuga Labs', dateStart: '2024-12', dateEnd: '2026-02', order: 1 }),
      makeItem({ company: 'Various', dateStart: '2006-01', dateEnd: '2013-12', order: 5 }),
      makeItem({ company: 'tokenproof', dateStart: '2022-01', dateEnd: '2024-12', order: 2 }),
    ];
    const sorted = sortByDateDesc(items);
    expect(sorted.map((i) => i.company)).toEqual([
      'Yuga Labs',
      'tokenproof',
      'METAONE',
      'Savare Medika',
      'Various',
    ]);
  });
});
