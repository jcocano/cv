import { describe, expect, it } from 'vitest';

import {
  detectFeaturedConflict,
  proposeDemotion,
  proposePromotion,
} from '@/lib/content/projects-assistant/featured-rules';
import type { Project } from '@/lib/schemas/projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug'>): Project {
  const base: Project = {
    slug: overrides.slug,
    title: { es: overrides.slug, en: overrides.slug },
    company: 'Acme',
    year: 2024,
    featured: false,
    tagline: { es: 't', en: 't' },
    description: { es: 'd', en: 'd' },
    cover: './cover.png',
    tags: [],
    eyebrow: { es: 'eyebrow', en: 'eyebrow' },
    stack: ['stack'],
  };
  return { ...base, ...overrides };
}

describe('detectFeaturedConflict', () => {
  it('returns conflicting=null when no featured project occupies the candidate order', () => {
    const projects: Project[] = [
      makeProject({ slug: 'alpha', featured: true, order: 1 }),
      makeProject({ slug: 'beta', featured: true, order: 3 }),
      makeProject({ slug: 'gamma' }),
    ];
    const result = detectFeaturedConflict(projects, 2);
    expect(result).toEqual({ conflicting: null });
  });

  it('returns the featured project occupying the candidate order when there is a clash', () => {
    const occupant = makeProject({ slug: 'beta', featured: true, order: 2 });
    const projects: Project[] = [
      makeProject({ slug: 'alpha', featured: true, order: 1 }),
      occupant,
      makeProject({ slug: 'gamma' }),
    ];
    const result = detectFeaturedConflict(projects, 2);
    expect(result.conflicting).toBeDefined();
    expect(result.conflicting).not.toBeNull();
    if (result.conflicting === null) {
      throw new Error('expected conflicting to be defined');
    }
    expect(result.conflicting.slug).toBe('beta');
    expect(result.conflicting.order).toBe(2);
    expect(result.conflicting.featured).toBe(true);
  });

  it('ignores non-featured projects even if they would coincide with the candidate order', () => {
    const projects: Project[] = [makeProject({ slug: 'alpha' })];
    const result = detectFeaturedConflict(projects, 1);
    expect(result.conflicting).toBeNull();
  });

  it('throws when candidateOrder is outside the [1, 3] range allowed by projectSchema', () => {
    const projects: Project[] = [makeProject({ slug: 'alpha' })];
    expect(() => detectFeaturedConflict(projects, 0)).toThrow(/order/i);
    expect(() => detectFeaturedConflict(projects, 4)).toThrow(/order/i);
  });
});

describe('proposeDemotion', () => {
  it('returns the conflicting featured project as the demotion candidate when clash exists', () => {
    const occupant = makeProject({ slug: 'beta', featured: true, order: 2 });
    const projects: Project[] = [
      makeProject({ slug: 'alpha', featured: true, order: 1 }),
      occupant,
    ];
    const candidates = proposeDemotion(projects, 2);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.slug).toBe('beta');
  });

  it('returns an empty list when no featured project occupies the candidate order', () => {
    const projects: Project[] = [
      makeProject({ slug: 'alpha', featured: true, order: 1 }),
      makeProject({ slug: 'beta', featured: true, order: 3 }),
    ];
    const candidates = proposeDemotion(projects, 2);
    expect(candidates).toEqual([]);
  });
});

describe('proposePromotion', () => {
  it('returns non-featured projects as candidates ordered by year descending then slug ascending', () => {
    const projects: Project[] = [
      makeProject({ slug: 'featured-one', featured: true, order: 1 }),
      makeProject({ slug: 'zeta', year: 2022 }),
      makeProject({ slug: 'alpha', year: 2024 }),
      makeProject({ slug: 'beta', year: 2024 }),
    ];
    const candidates = proposePromotion(projects, 2);
    expect(candidates.map((project) => project.slug)).toEqual(['alpha', 'beta', 'zeta']);
  });

  it('returns an empty list when every project is already featured', () => {
    const projects: Project[] = [
      makeProject({ slug: 'a', featured: true, order: 1 }),
      makeProject({ slug: 'b', featured: true, order: 2 }),
      makeProject({ slug: 'c', featured: true, order: 3 }),
    ];
    const candidates = proposePromotion(projects, 1);
    expect(candidates).toEqual([]);
  });

  it('throws when freedOrder is outside the [1, 3] range allowed by projectSchema', () => {
    const projects: Project[] = [makeProject({ slug: 'alpha' })];
    expect(() => proposePromotion(projects, 0)).toThrow(/order/i);
    expect(() => proposePromotion(projects, 4)).toThrow(/order/i);
  });
});
