import { describe, expect, it } from 'vitest';

import { validateProjects } from '@/lib/content/validate-projects';
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

describe('validateProjects', () => {
  it('passes with an empty array (relaxed: no featured required)', () => {
    expect(() => validateProjects([])).not.toThrow();
  });

  it('passes with N non-featured entries and zero featured', () => {
    const projects: Project[] = [
      makeProject({ slug: 'a' }),
      makeProject({ slug: 'b' }),
      makeProject({ slug: 'c' }),
    ];
    expect(() => validateProjects(projects)).not.toThrow();
  });

  it('passes with exactly one featured entry (order=1)', () => {
    const projects: Project[] = [
      makeProject({ slug: 'hero', featured: true, order: 1 }),
      makeProject({ slug: 'b' }),
    ];
    expect(() => validateProjects(projects)).not.toThrow();
  });

  it('passes with three featured entries with orders 1, 2, 3', () => {
    const projects: Project[] = [
      makeProject({ slug: 'a', featured: true, order: 1 }),
      makeProject({ slug: 'b', featured: true, order: 2 }),
      makeProject({ slug: 'c', featured: true, order: 3 }),
    ];
    expect(() => validateProjects(projects)).not.toThrow();
  });

  it('throws when two featured entries share the same order, listing both slugs', () => {
    const projects: Project[] = [
      makeProject({ slug: 'alpha', featured: true, order: 2 }),
      makeProject({ slug: 'beta', featured: true, order: 2 }),
      makeProject({ slug: 'no-featured' }),
    ];
    expect(() => validateProjects(projects)).toThrow(/alpha/);
    expect(() => validateProjects(projects)).toThrow(/beta/);
    expect(() => validateProjects(projects)).toThrow(/order/i);
  });

  it('throws when three featured entries share the same order (lists all slugs)', () => {
    const projects: Project[] = [
      makeProject({ slug: 'a', featured: true, order: 1 }),
      makeProject({ slug: 'b', featured: true, order: 1 }),
      makeProject({ slug: 'c', featured: true, order: 1 }),
    ];
    const fn = () => validateProjects(projects);
    expect(fn).toThrow(/a/);
    expect(fn).toThrow(/b/);
    expect(fn).toThrow(/c/);
  });
});
