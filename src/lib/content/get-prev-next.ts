import type { Project } from '@/lib/schemas/projects';

export interface PrevNext {
  prev: Project | null;
  next: Project | null;
}

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
