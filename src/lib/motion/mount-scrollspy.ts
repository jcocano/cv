import { currentVisibleSection, type SectionIntersection } from '@/lib/motion/scrollspy';

export interface MountScrollspyOptions {
  rootMargin?: string;
}

export interface MountScrollspyHandle {
  dispose: () => void;
}

const DEFAULT_ROOT_MARGIN = '-30% 0px -60% 0px';
const DEFAULT_THRESHOLDS: number[] = [0, 0.25, 0.5, 0.75, 1];
const ACTIVE_CLASS = 'active';

export function mountScrollspy(
  navLinks: Iterable<HTMLAnchorElement>,
  sections: Iterable<HTMLElement>,
  options?: MountScrollspyOptions,
): MountScrollspyHandle {
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const ratios = new Map<string, number>();
  const materialisedNavLinks: HTMLAnchorElement[] = Array.from(navLinks);
  const materialisedSections: HTMLElement[] = Array.from(sections);

  for (const section of materialisedSections) {
    if (section.id !== '') {
      ratios.set(section.id, 0);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (target.id !== '') {
          ratios.set(target.id, entry.intersectionRatio);
        }
      }
      const intersections: SectionIntersection[] = [];
      ratios.forEach((ratio, id) => {
        intersections.push({ id, ratio });
      });
      const visibleId = currentVisibleSection(intersections);
      if (visibleId === null) {
        return;
      }
      const targetHash = `#${visibleId}`;
      for (const link of materialisedNavLinks) {
        if (link.getAttribute('href') === targetHash) {
          link.classList.add(ACTIVE_CLASS);
        } else {
          link.classList.remove(ACTIVE_CLASS);
        }
      }
    },
    { rootMargin, threshold: DEFAULT_THRESHOLDS },
  );

  for (const section of materialisedSections) {
    observer.observe(section);
  }

  return {
    dispose: (): void => {
      observer.disconnect();
    },
  };
}
