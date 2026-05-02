import { describe, expect, it } from 'vitest';

import { splitFeatured } from '@/lib/content/split-featured';
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
  };
  return { ...base, ...overrides };
}

describe('splitFeatured', () => {
  it('returns the only featured project as featured and the rest in order ascending', () => {
    const projects: Project[] = [
      makeProject({ slug: 'cluster', order: 2 }),
      makeProject({ slug: 'made-by-apes', order: 1, featured: true }),
      makeProject({ slug: 'incommers', order: 3 }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured.slug).toBe('made-by-apes');
    expect(result.rest).toHaveLength(2);
    expect(result.rest[0]?.slug).toBe('cluster');
    expect(result.rest[1]?.slug).toBe('incommers');
  });

  it('throws with the exact contract message when there are zero featured projects', () => {
    const projects: Project[] = [
      makeProject({ slug: 'cluster', order: 1 }),
      makeProject({ slug: 'incommers', order: 2 }),
    ];

    expect(() => splitFeatured(projects)).toThrow(
      'splitFeatured requires at least one featured project, got 0',
    );
  });

  it('returns the featured project with the lowest order when there are two featured projects, the other goes to rest', () => {
    const projects: Project[] = [
      makeProject({ slug: 'incommers', order: 3 }),
      makeProject({ slug: 'beta', order: 5, featured: true }),
      makeProject({ slug: 'alpha', order: 2, featured: true }),
    ];

    const result = splitFeatured(projects);

    expect(result.featured.slug).toBe('alpha');
    expect(result.rest).toHaveLength(2);
    // rest is order-asc: incommers (3), beta (5)
    expect(result.rest[0]?.slug).toBe('incommers');
    expect(result.rest[1]?.slug).toBe('beta');
  });

  it('throws with the exact message when given an empty array', () => {
    expect(() => splitFeatured([])).toThrow(
      'splitFeatured requires at least one featured project, got 0',
    );
  });
});
