import { afterEach, describe, expect, it, vi } from 'vitest';

import { mountReveal } from '@/lib/motion/reveal';

interface MockElement {
  classes: Set<string>;
  classList: {
    add: (name: string) => void;
    remove: (name: string) => void;
    contains: (name: string) => boolean;
  };
}

function createMockElement(): MockElement {
  const classes = new Set<string>();
  const element: MockElement = {
    classes,
    classList: {
      add: (name: string): void => {
        classes.add(name);
      },
      remove: (name: string): void => {
        classes.delete(name);
      },
      contains: (name: string): boolean => classes.has(name),
    },
  };
  return element;
}

interface FakeObserver {
  readonly callback: IntersectionObserverCallback;
  readonly init: { threshold: number | undefined; rootMargin: string | undefined };
  readonly observed: Set<Element>;
  readonly unobserved: Element[];
  disconnectCount: number;
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
  takeRecords(): IntersectionObserverEntry[];
}

function installIntersectionObserverMock(): { observers: FakeObserver[] } {
  const observers: FakeObserver[] = [];
  class FakeIntersectionObserver implements FakeObserver {
    readonly callback: IntersectionObserverCallback;
    readonly init: { threshold: number | undefined; rootMargin: string | undefined };
    readonly observed = new Set<Element>();
    readonly unobserved: Element[] = [];
    disconnectCount = 0;
    readonly root = null;

    constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      this.callback = callback;
      const rawThreshold = init?.threshold;
      const threshold =
        typeof rawThreshold === 'number'
          ? rawThreshold
          : Array.isArray(rawThreshold)
            ? rawThreshold[0]
            : undefined;
      this.init = { threshold, rootMargin: init?.rootMargin };
      observers.push(this);
    }

    observe(target: Element): void {
      this.observed.add(target);
    }

    unobserve(target: Element): void {
      this.observed.delete(target);
      this.unobserved.push(target);
    }

    disconnect(): void {
      this.disconnectCount += 1;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  return { observers };
}

interface DocumentMockOptions {
  revealElements: MockElement[];
}

function installDocumentMock(options: DocumentMockOptions): void {
  const documentMock = {
    querySelectorAll: (selector: string): MockElement[] => {
      if (selector === '.reveal') {
        return options.revealElements;
      }
      return [];
    },
  };
  vi.stubGlobal('document', documentMock);
}

function makeIntersectionEntry(target: MockElement, isIntersecting: boolean): unknown {
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 0.5 : 0,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mountReveal', () => {
  it('adds "in" to a .reveal element when it intersects and stops observing it', () => {
    const target = createMockElement();
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [target] });

    mountReveal();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.has(target as unknown as Element)).toBe(true);

    observer.callback(
      [makeIntersectionEntry(target, true)] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );

    expect(target.classList.contains('in')).toBe(true);
    expect(observer.unobserved).toContain(target as unknown as Element);
  });

  it('does not add "in" when the entry is not intersecting', () => {
    const target = createMockElement();
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [target] });

    mountReveal();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }

    observer.callback(
      [makeIntersectionEntry(target, false)] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );

    expect(target.classList.contains('in')).toBe(false);
    expect(observer.unobserved).not.toContain(target as unknown as Element);
  });

  it('observes each .reveal element independently when there are several', () => {
    const a = createMockElement();
    const b = createMockElement();
    const c = createMockElement();
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [a, b, c] });

    mountReveal();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.size).toBe(3);
    expect(observer.observed.has(a as unknown as Element)).toBe(true);
    expect(observer.observed.has(b as unknown as Element)).toBe(true);
    expect(observer.observed.has(c as unknown as Element)).toBe(true);
  });

  it('dispose() disconnects the observer', () => {
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [] });

    const handle = mountReveal();
    handle.dispose();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.disconnectCount).toBe(1);
  });

  it('is a no-op (creates an observer but observes nothing) when there are zero .reveal elements', () => {
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [] });

    mountReveal();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.size).toBe(0);
  });

  it('uses default threshold 0.08 and rootMargin "0px 0px -40px 0px" matching the handoff', () => {
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [] });

    mountReveal();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.init.threshold).toBe(0.08);
    expect(observer.init.rootMargin).toBe('0px 0px -40px 0px');
  });

  it('respects custom threshold and rootMargin when provided', () => {
    const { observers } = installIntersectionObserverMock();
    installDocumentMock({ revealElements: [] });

    mountReveal({ threshold: 0.5, rootMargin: '10px 20px 30px 40px' });

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.init.threshold).toBe(0.5);
    expect(observer.init.rootMargin).toBe('10px 20px 30px 40px');
  });
});
