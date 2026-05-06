/**
 * Pure helper that picks which section id should be marked active in a
 * scrollspy sub-nav. The DOM-aware Astro component that owns the
 * `IntersectionObserver` is a thin wrapper that maps each
 * `IntersectionObserverEntry` to a `SectionVisibility` and forwards the call.
 *
 * Rules:
 *   - If at least one section reports `isIntersecting`, the one with the
 *     highest `intersectionRatio` wins. Ties break by document order: the
 *     first matching entry in the input array stays active. The order of the
 *     input array MUST mirror the order of the sections in the DOM.
 *   - If no section currently intersects but a `previousActiveId` was passed
 *     in, keep that id active (so the highlight does not flicker between
 *     sections).
 *   - If no section intersects and there is no `previousActiveId`, return
 *     `null`. Empty input always returns `null`.
 *   - `isIntersecting=true` with `intersectionRatio=0` is treated as visible
 *     (the boundary just touches the rootMargin).
 */
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
    // Ties (entry.intersectionRatio === best.intersectionRatio): keep `best`
    // — first declared wins because we iterate in array order.
  }
  if (best !== null) {
    return best.id;
  }
  return previousActiveId;
}
