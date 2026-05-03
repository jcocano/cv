import type { Project } from '@/lib/schemas/projects';

export interface PrevNext {
  prev: Project | null;
  next: Project | null;
}

/**
 * Returns the previous and next neighbors of `current` in `all`, ordered by
 * `order` ascending.
 *
 * - The first project (lowest `order`) has `prev: null`.
 * - The last project (highest `order`) has `next: null`.
 * - If `current` is not present in `all`, both neighbors are `null`.
 *
 * The function is pure: it never mutates the input array.
 */
export function getPrevNext(current: Project, all: readonly Project[]): PrevNext {
  const ordered: Project[] = [...all].sort((a, b) => a.order - b.order);
  const currentIndex = ordered.findIndex((project) => project.slug === current.slug);
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }
  const prev = currentIndex > 0 ? (ordered[currentIndex - 1] ?? null) : null;
  const next = currentIndex < ordered.length - 1 ? (ordered[currentIndex + 1] ?? null) : null;
  return { prev, next };
}
