export interface SectionVisibility {
  readonly id: string;
  readonly isIntersecting: boolean;
  readonly intersectionRatio: number;
}

export function pickHighestIntersectingByDocumentOrder(
  entries: ReadonlyArray<SectionVisibility>,
): string | null {
  let best: SectionVisibility | null = null;
  for (const entry of entries) {
    if (!entry.isIntersecting) {
      continue;
    }
    if (best === null) {
      best = entry;
      continue;
    }
    if (entry.intersectionRatio > best.intersectionRatio) {
      best = entry;
    }
  }
  return best === null ? null : best.id;
}

export function keepPreviousIfNoneVisible(
  visibleId: string | null,
  previousActiveId: string | null,
): string | null {
  if (visibleId !== null) {
    return visibleId;
  }
  return previousActiveId;
}

export function nullWhenAbsent(resolvedId: string | null): string | null {
  return resolvedId;
}

export function pickActiveSection(
  entries: ReadonlyArray<SectionVisibility>,
  previousActiveId: string | null,
): string | null {
  if (entries.length === 0) {
    return nullWhenAbsent(null);
  }
  const visibleId = pickHighestIntersectingByDocumentOrder(entries);
  const resolvedId = keepPreviousIfNoneVisible(visibleId, previousActiveId);
  return nullWhenAbsent(resolvedId);
}
