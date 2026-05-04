import { describe, expect, it } from 'vitest';

import { getPrevNext } from '@/lib/content/get-prev-next';
import type { Project } from '@/lib/schemas/projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug' | 'order'>): Project {
  const base: Project = {
    slug: overrides.slug,
    title: { es: overrides.slug, en: overrides.slug },
    company: 'Acme',
    year: 2025,
    featured: false,
    tagline: { es: 'tag', en: 'tag' },
    description: { es: 'desc', en: 'desc' },
    cover: './cover.png',
    tags: [],
    order: overrides.order,
    eyebrow: { es: 'eyebrow', en: 'eyebrow' },
    stack: ['stack'],
  };
  return { ...base, ...overrides };
}

describe('getPrevNext (circular)', () => {
  const alpha = makeProject({ slug: 'alpha', order: 1 });
  const beta = makeProject({ slug: 'beta', order: 2 });
  const gamma = makeProject({ slug: 'gamma', order: 3 });

  describe('N = 0 (empty list)', () => {
    it('returns prev=null and next=null when the list is empty (current absent)', () => {
      const result = getPrevNext(alpha, []);
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });

  describe('N = 1 (only current)', () => {
    it('returns prev=null and next=null when the list contains only the current project (no peer to rotate to)', () => {
      const result = getPrevNext(alpha, [alpha]);
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });

  describe('N = 2 (each project rotates to the other)', () => {
    it('alpha (first) rotates to beta on both sides', () => {
      const result = getPrevNext(alpha, [alpha, beta]);
      expect(result.prev?.slug).toBe('beta');
      expect(result.next?.slug).toBe('beta');
    });

    it('beta (last) rotates to alpha on both sides', () => {
      const result = getPrevNext(beta, [alpha, beta]);
      expect(result.prev?.slug).toBe('alpha');
      expect(result.next?.slug).toBe('alpha');
    });
  });

  describe('N = 3 (wrap-around at the boundaries)', () => {
    it('first project (alpha) wraps prev to the last (gamma) and next to the second (beta)', () => {
      const result = getPrevNext(alpha, [alpha, beta, gamma]);
      expect(result.prev?.slug).toBe('gamma');
      expect(result.next?.slug).toBe('beta');
    });

    it('middle project (beta) keeps direct neighbors prev=alpha next=gamma', () => {
      const result = getPrevNext(beta, [alpha, beta, gamma]);
      expect(result.prev?.slug).toBe('alpha');
      expect(result.next?.slug).toBe('gamma');
    });

    it('last project (gamma) wraps prev to the second-to-last (beta) and next to the first (alpha)', () => {
      const result = getPrevNext(gamma, [alpha, beta, gamma]);
      expect(result.prev?.slug).toBe('beta');
      expect(result.next?.slug).toBe('alpha');
    });
  });

  describe('current absent from list', () => {
    it('returns prev=null and next=null when the current project is not present in the list (N=3 case)', () => {
      const orphan = makeProject({ slug: 'orphan', order: 99 });
      const result = getPrevNext(orphan, [alpha, beta, gamma]);
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });

    it('returns prev=null and next=null when the current project is not present in the list (N=2 case)', () => {
      const orphan = makeProject({ slug: 'orphan', order: 99 });
      const result = getPrevNext(orphan, [alpha, beta]);
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });

  describe('contract preserved: sort by order ascending; never returns current as a neighbor', () => {
    it('orders the input list by `order` ascending before computing neighbors (input order is irrelevant)', () => {
      const shuffled: Project[] = [gamma, alpha, beta];
      const result = getPrevNext(beta, shuffled);
      expect(result.prev?.slug).toBe('alpha');
      expect(result.next?.slug).toBe('gamma');
    });

    it('does not mutate the input array', () => {
      const input: Project[] = [gamma, alpha, beta];
      const snapshot = [...input];
      getPrevNext(beta, input);
      expect(input).toEqual(snapshot);
    });

    it('never returns `current` itself as prev or next when the list has 2+ items (circular invariant)', () => {
      const r3a = getPrevNext(alpha, [alpha, beta, gamma]);
      expect(r3a.prev?.slug).not.toBe(alpha.slug);
      expect(r3a.next?.slug).not.toBe(alpha.slug);
      const r3b = getPrevNext(beta, [alpha, beta, gamma]);
      expect(r3b.prev?.slug).not.toBe(beta.slug);
      expect(r3b.next?.slug).not.toBe(beta.slug);
      const r3c = getPrevNext(gamma, [alpha, beta, gamma]);
      expect(r3c.prev?.slug).not.toBe(gamma.slug);
      expect(r3c.next?.slug).not.toBe(gamma.slug);
      const r2a = getPrevNext(alpha, [alpha, beta]);
      expect(r2a.prev?.slug).not.toBe(alpha.slug);
      expect(r2a.next?.slug).not.toBe(alpha.slug);
    });
  });
});
