/**
 * Pure ordering helper for the experience timeline.
 *
 * The shape used by this module is the structural minimum required to sort
 * experience entries; it intentionally does not depend on the full
 * `Experience` schema so unit tests can construct fixtures without resolving
 * the bilingual `i18nString` fields.
 */
export interface SortableExperience {
  company: string;
  dateStart: string;
  dateEnd: string | null;
  order: number;
}

/**
 * Orders experience entries for the timeline, "most recently finished" first.
 *
 * Rules (in order):
 *   1. Entries with `dateEnd === null` (current roles) come before any
 *      finished entry. The intent is "the role I am in right now sits at
 *      the top of the CV".
 *   2. Otherwise, by `dateEnd` descending (lexicographic compare on the
 *      ISO `YYYY-MM` strings, which matches chronological order). The role
 *      that ended most recently surfaces above older finished roles, even
 *      if their `dateStart` is earlier — this matches the visual order of
 *      the design handoff and the natural reading of a CV.
 *   3. Ties on `dateEnd` (and ties among current roles, where both are
 *      `null`) are broken by `order` ascending.
 *
 * The function is pure: it never mutates the input array.
 */
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
