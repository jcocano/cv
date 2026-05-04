import type { Project } from '@/lib/schemas/projects';

export interface PrevNext {
  prev: Project | null;
  next: Project | null;
}

/**
 * Returns the previous and next neighbors of `current` in `all`, ordered by
 * `order` ascending. Rotation is circular: at the boundaries the neighbors
 * wrap around so that the last project's `next` is the first, and the first
 * project's `prev` is the last.
 *
 * - N = 0: `{ prev: null, next: null }` (empty collection).
 * - N = 1: `{ prev: null, next: null }` (only `current`, no peer to rotate to).
 * - N >= 2: always returns a project != `current` on both sides.
 * - If `current` is not present in `all`: `{ prev: null, next: null }`.
 *
 * The function is pure: it never mutates the input array.
 */
export function getPrevNext(current: Project, all: readonly Project[]): PrevNext {
  const ordered: Project[] = [...all].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  const currentIndex = ordered.findIndex((project) => project.slug === current.slug);
  if (currentIndex === -1 || ordered.length < 2) {
    return { prev: null, next: null };
  }
  const lastIndex = ordered.length - 1;
  const prevIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
  const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
  const prev = ordered[prevIndex] ?? null;
  const next = ordered[nextIndex] ?? null;
  return { prev, next };
}
