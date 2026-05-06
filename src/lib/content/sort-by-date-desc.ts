import {
  compareByOrderAsc,
  compareCurrentRolesFirst,
  compareFinishedByDateEndDesc,
  type SortableExperience,
} from '@/lib/content/experience-comparators';

export type { SortableExperience } from '@/lib/content/experience-comparators';

export function sortByDateDesc<T extends SortableExperience>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const currentRolesFirst = compareCurrentRolesFirst(a, b);
    if (currentRolesFirst !== 0) {
      return currentRolesFirst;
    }
    const finishedByDateEndDesc = compareFinishedByDateEndDesc(a, b);
    if (finishedByDateEndDesc !== 0) {
      return finishedByDateEndDesc;
    }
    return compareByOrderAsc(a, b);
  });
}
