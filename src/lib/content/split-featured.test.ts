import { describe, expect, it } from 'vitest';

import { splitFeatured } from '@/lib/content/split-featured';
import type { Project } from '@/lib/schemas/projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug'>): Project {
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
    eyebrow: { es: 'eyebrow', en: 'eyebrow' },
    stack: ['stack'],
  };
  return { ...base, ...overrides };
}

describe('splitFeatured', () => {
  it('returns the only featured project as featured and the rest in order ascending', () => {
    const projects: Project[] = [
      makeProject({ slug: 'cluster', featured: true, order: 1 }),
      makeProject({ slug: 'made-by-apes', featured: true, order: 2 }),
      makeProject({ slug: 'incommers', featured: true, order: 3 }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured?.slug).toBe('cluster');
    expect(result.rest).toHaveLength(2);
    expect(result.rest[0]?.slug).toBe('made-by-apes');
    expect(result.rest[1]?.slug).toBe('incommers');
  });

  it('returns featured: null and rest: [] when given an empty array (no throw)', () => {
    const result = splitFeatured([]);
    expect(result.featured).toBeNull();
    expect(result.rest).toEqual([]);
  });

  it('returns featured: null and rest: [] when there are zero featured projects (no throw)', () => {
    const projects: Project[] = [
      makeProject({ slug: 'cluster' }),
      makeProject({ slug: 'incommers' }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured).toBeNull();
    expect(result.rest).toEqual([]);
  });

  it('returns the featured project with the lowest order when there are two featured projects, the other goes to rest', () => {
    const projects: Project[] = [
      makeProject({ slug: 'beta', featured: true, order: 3 }),
      makeProject({ slug: 'alpha', featured: true, order: 2 }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured?.slug).toBe('alpha');
    expect(result.rest).toHaveLength(1);
    expect(result.rest[0]?.slug).toBe('beta');
  });

  it('only accepts featured entries; non-featured items are ignored entirely', () => {
    const projects: Project[] = [
      makeProject({ slug: 'cluster' }),
      makeProject({ slug: 'made-by-apes', featured: true, order: 1 }),
      makeProject({ slug: 'incommers' }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured?.slug).toBe('made-by-apes');
    expect(result.rest).toEqual([]);
  });
});
