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

describe('getPrevNext', () => {
  const alpha = makeProject({ slug: 'alpha', order: 1 });
  const beta = makeProject({ slug: 'beta', order: 2 });
  const gamma = makeProject({ slug: 'gamma', order: 3 });

  it('returns prev=null and next=beta for the first project (lowest order) in a 3-item list', () => {
    const result = getPrevNext(alpha, [alpha, beta, gamma]);
    expect(result.prev).toBeNull();
    expect(result.next?.slug).toBe('beta');
  });

  it('returns prev=alpha and next=gamma for the middle project in a 3-item list', () => {
    const result = getPrevNext(beta, [alpha, beta, gamma]);
    expect(result.prev?.slug).toBe('alpha');
    expect(result.next?.slug).toBe('gamma');
  });

  it('returns prev=beta and next=null for the last project (highest order) in a 3-item list', () => {
    const result = getPrevNext(gamma, [alpha, beta, gamma]);
    expect(result.prev?.slug).toBe('beta');
    expect(result.next).toBeNull();
  });

  it('returns prev=null and next=null when the list contains only the current project', () => {
    const result = getPrevNext(alpha, [alpha]);
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it('returns prev=null and next=null when the current project is not present in the list', () => {
    const orphan = makeProject({ slug: 'orphan', order: 99 });
    const result = getPrevNext(orphan, [alpha, beta, gamma]);
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

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
});
