import {
  compareByDateEndDesc,
  compareByOrderAsc,
  compareCurrentRolesFirst,
} from '@/lib/content/experience-comparators';

export interface SortableExperience {
  company: string;
  dateStart: string;
  dateEnd: string | null;
  order: number;
}

export function sortByDateDesc<T extends SortableExperience>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const currentRolesFirst = compareCurrentRolesFirst(a, b);
    if (currentRolesFirst !== 0) {
      return currentRolesFirst;
    }
    const byDateEndDesc = compareByDateEndDesc(a, b);
    if (byDateEndDesc !== 0) {
      return byDateEndDesc;
    }
    return compareByOrderAsc(a, b);
  });
}
