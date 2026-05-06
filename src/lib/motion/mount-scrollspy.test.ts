import { afterEach, describe, expect, it, vi } from 'vitest';

import { mountScrollspy } from '@/lib/motion/mount-scrollspy';

interface MockNavLink {
  href: string;
  getAttribute(name: string): string | null;
  classes: Set<string>;
  classList: {
    add: (name: string) => void;
    remove: (name: string) => void;
    contains: (name: string) => boolean;
  };
}

function createMockNavLink(href: string): MockNavLink {
  const classes = new Set<string>();
  return {
    href,
    getAttribute: (name: string): string | null => (name === 'href' ? href : null),
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
}

interface MockSection {
  id: string;
}

function createMockSection(id: string): MockSection {
  return { id };
}

interface FakeObserver {
  readonly callback: IntersectionObserverCallback;
  readonly init: { rootMargin: string | undefined; threshold: number | number[] | undefined };
  readonly observed: Set<Element>;
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
    readonly init: { rootMargin: string | undefined; threshold: number | number[] | undefined };
    readonly observed = new Set<Element>();
    disconnectCount = 0;
    readonly root = null;

    constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      this.callback = callback;
      this.init = { rootMargin: init?.rootMargin, threshold: init?.threshold };
      observers.push(this);
    }

    observe(target: Element): void {
      this.observed.add(target);
    }

    unobserve(target: Element): void {
      this.observed.delete(target);
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

function makeIntersectionEntry(target: MockSection, ratio: number): unknown {
  return {
    target,
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function asNavLinks(links: MockNavLink[]): NodeListOf<HTMLAnchorElement> {
  return links as unknown as NodeListOf<HTMLAnchorElement>;
}

function asSections(sections: MockSection[]): NodeListOf<HTMLElement> {
  return sections as unknown as NodeListOf<HTMLElement>;
}

describe('mountScrollspy', () => {
  it('observes every section passed in', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const contactLink = createMockNavLink('#contact');
    const aboutSection = createMockSection('about');
    const workSection = createMockSection('work');
    const contactSection = createMockSection('contact');

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(
      asNavLinks([aboutLink, workLink, contactLink]),
      asSections([aboutSection, workSection, contactSection]),
    );

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.size).toBe(3);
    expect(observer.observed.has(aboutSection as unknown as Element)).toBe(true);
    expect(observer.observed.has(workSection as unknown as Element)).toBe(true);
    expect(observer.observed.has(contactSection as unknown as Element)).toBe(true);
  });

  it('adds "active" only to the nav-link whose href matches the visible section id', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const contactLink = createMockNavLink('#contact');
    const aboutSection = createMockSection('about');
    const workSection = createMockSection('work');
    const contactSection = createMockSection('contact');

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(
      asNavLinks([aboutLink, workLink, contactLink]),
      asSections([aboutSection, workSection, contactSection]),
    );

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0.1),
        makeIntersectionEntry(workSection, 0.7),
        makeIntersectionEntry(contactSection, 0.0),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );

    expect(workLink.classList.contains('active')).toBe(true);
    expect(aboutLink.classList.contains('active')).toBe(false);
    expect(contactLink.classList.contains('active')).toBe(false);
  });

  it('moves "active" from the previously visible nav-link to the new one as the user scrolls', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const contactLink = createMockNavLink('#contact');
    const aboutSection = createMockSection('about');
    const workSection = createMockSection('work');
    const contactSection = createMockSection('contact');

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(
      asNavLinks([aboutLink, workLink, contactLink]),
      asSections([aboutSection, workSection, contactSection]),
    );

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }

    observer.callback(
      [makeIntersectionEntry(aboutSection, 0.9)] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(aboutLink.classList.contains('active')).toBe(true);

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0.05),
        makeIntersectionEntry(workSection, 0.8),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(workLink.classList.contains('active')).toBe(true);
    expect(aboutLink.classList.contains('active')).toBe(false);

    observer.callback(
      [
        makeIntersectionEntry(workSection, 0.05),
        makeIntersectionEntry(contactSection, 0.95),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(contactLink.classList.contains('active')).toBe(true);
    expect(workLink.classList.contains('active')).toBe(false);
    expect(aboutLink.classList.contains('active')).toBe(false);
  });

  it('does not change the active nav-link when no section is visible (all ratios 0)', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const aboutSection = createMockSection('about');
    const workSection = createMockSection('work');

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(asNavLinks([aboutLink, workLink]), asSections([aboutSection, workSection]));

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }

    observer.callback(
      [makeIntersectionEntry(aboutSection, 0.5)] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(aboutLink.classList.contains('active')).toBe(true);

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0),
        makeIntersectionEntry(workSection, 0),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );

    expect(aboutLink.classList.contains('active')).toBe(true);
    expect(workLink.classList.contains('active')).toBe(false);
  });

  it('dispose() disconnects the observer', () => {
    const { observers } = installIntersectionObserverMock();
    const handle = mountScrollspy(asNavLinks([]), asSections([]));
    handle.dispose();

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.disconnectCount).toBe(1);
  });

  it('respects a custom rootMargin when provided', () => {
    const { observers } = installIntersectionObserverMock();
    mountScrollspy(asNavLinks([]), asSections([]), { rootMargin: '-30% 0px -60% 0px' });

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.init.rootMargin).toBe('-30% 0px -60% 0px');
  });

  it('uses an array of thresholds so the IO emits multiple ratio levels per section', () => {
    const { observers } = installIntersectionObserverMock();
    mountScrollspy(asNavLinks([]), asSections([]));

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(Array.isArray(observer.init.threshold)).toBe(true);
  });

  it('highlights a nav-link whose href points to a wrapper div (not a <section>) when the wrapper is the most-visible target', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const aboutWrapper = createMockSection('about');
    const workSection = createMockSection('work');

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(asNavLinks([aboutLink, workLink]), asSections([aboutWrapper, workSection]));

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }

    observer.callback(
      [
        makeIntersectionEntry(aboutWrapper, 0.85),
        makeIntersectionEntry(workSection, 0.1),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );

    expect(aboutLink.classList.contains('active')).toBe(true);
    expect(workLink.classList.contains('active')).toBe(false);
  });

  it('moves "active" across the 5 nav-redesign sections (about → experience → stack → work → contact)', () => {
    const aboutLink = createMockNavLink('#about');
    const experienceLink = createMockNavLink('#experience');
    const stackLink = createMockNavLink('#stack');
    const workLink = createMockNavLink('#work');
    const contactLink = createMockNavLink('#contact');
    const aboutSection = createMockSection('about');
    const experienceSection = createMockSection('experience');
    const stackSection = createMockSection('stack');
    const workSection = createMockSection('work');
    const contactSection = createMockSection('contact');

    const allLinks = [aboutLink, experienceLink, stackLink, workLink, contactLink];
    const allSections = [
      aboutSection,
      experienceSection,
      stackSection,
      workSection,
      contactSection,
    ];

    const { observers } = installIntersectionObserverMock();
    mountScrollspy(asNavLinks(allLinks), asSections(allSections));

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.size).toBe(5);

    function activeHrefs(): string[] {
      return allLinks.filter((link) => link.classList.contains('active')).map((link) => link.href);
    }

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0.9),
        makeIntersectionEntry(experienceSection, 0.05),
        makeIntersectionEntry(stackSection, 0),
        makeIntersectionEntry(workSection, 0),
        makeIntersectionEntry(contactSection, 0),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(activeHrefs()).toEqual(['#about']);

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0.05),
        makeIntersectionEntry(experienceSection, 0.85),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(activeHrefs()).toEqual(['#experience']);

    observer.callback(
      [
        makeIntersectionEntry(experienceSection, 0.05),
        makeIntersectionEntry(stackSection, 0.92),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(activeHrefs()).toEqual(['#stack']);

    observer.callback(
      [
        makeIntersectionEntry(stackSection, 0.05),
        makeIntersectionEntry(workSection, 0.7),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(activeHrefs()).toEqual(['#work']);

    observer.callback(
      [
        makeIntersectionEntry(workSection, 0.05),
        makeIntersectionEntry(contactSection, 0.95),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(activeHrefs()).toEqual(['#contact']);
  });

  it('accepts a plain HTMLElement[] as the sections argument (not just NodeListOf)', () => {
    const aboutLink = createMockNavLink('#about');
    const workLink = createMockNavLink('#work');
    const aboutSection = createMockSection('about');
    const workSection = createMockSection('work');

    const { observers } = installIntersectionObserverMock();
    const sectionsArray = [aboutSection, workSection] as unknown as readonly HTMLElement[];
    mountScrollspy(asNavLinks([aboutLink, workLink]), sectionsArray);

    const observer = observers[0];
    if (observer === undefined) {
      throw new Error('expected an observer to be created');
    }
    expect(observer.observed.size).toBe(2);
    expect(observer.observed.has(aboutSection as unknown as Element)).toBe(true);
    expect(observer.observed.has(workSection as unknown as Element)).toBe(true);

    observer.callback(
      [
        makeIntersectionEntry(aboutSection, 0.05),
        makeIntersectionEntry(workSection, 0.9),
      ] as unknown as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(workLink.classList.contains('active')).toBe(true);
    expect(aboutLink.classList.contains('active')).toBe(false);
  });
});
