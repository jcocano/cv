export interface MountRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

export interface MountRevealHandle {
  dispose: () => void;
}

const DEFAULT_THRESHOLD = 0.08;
const DEFAULT_ROOT_MARGIN = '0px 0px -40px 0px';

export function mountReveal(options?: MountRevealOptions): MountRevealHandle {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;

  const observer = new IntersectionObserver(
    (entries, instance) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          instance.unobserve(entry.target);
        }
      }
    },
    { threshold, rootMargin },
  );

  const targets = document.querySelectorAll<Element>('.reveal');
  targets.forEach((target) => {
    observer.observe(target);
  });

  return {
    dispose: (): void => {
      observer.disconnect();
    },
  };
}
