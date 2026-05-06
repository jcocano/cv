export interface SortableExperience {
  company: string;
  dateStart: string;
  dateEnd: string | null;
  order: number;
}

export function sortByDateDesc<T extends SortableExperience>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const aIsCurrent = a.dateEnd === null;
    const bIsCurrent = b.dateEnd === null;
    if (aIsCurrent !== bIsCurrent) {
      return aIsCurrent ? -1 : 1;
    }
    if (a.dateEnd !== null && b.dateEnd !== null && a.dateEnd !== b.dateEnd) {
      return a.dateEnd < b.dateEnd ? 1 : -1;
    }
    return a.order - b.order;
  });
}
