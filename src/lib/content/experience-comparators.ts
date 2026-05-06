import type { SortableExperience } from '@/lib/content/sort-by-date-desc';

export function compareCurrentRolesFirst(a: SortableExperience, b: SortableExperience): number {
  const aIsCurrent = a.dateEnd === null;
  const bIsCurrent = b.dateEnd === null;
  if (aIsCurrent === bIsCurrent) {
    return 0;
  }
  return aIsCurrent ? -1 : 1;
}

export function compareByDateEndDesc(a: SortableExperience, b: SortableExperience): number {
  if (a.dateEnd === null || b.dateEnd === null) {
    return 0;
  }
  if (a.dateEnd === b.dateEnd) {
    return 0;
  }
  return a.dateEnd < b.dateEnd ? 1 : -1;
}

export function compareByOrderAsc(a: SortableExperience, b: SortableExperience): number {
  return a.order - b.order;
}
