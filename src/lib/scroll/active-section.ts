export interface SectionVisibility {
  readonly id: string;
  readonly isIntersecting: boolean;
  readonly intersectionRatio: number;
}

export function pickActiveSection(
  entries: ReadonlyArray<SectionVisibility>,
  previousActiveId: string | null,
): string | null {
  if (entries.length === 0) {
    return null;
  }
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
  if (best !== null) {
    return best.id;
  }
  return previousActiveId;
}
