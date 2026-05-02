import { describe, expect, it } from 'vitest';

import { sideProjectSchema } from '@/lib/schemas/side-projects';

const validSideProject = {
  slug: 'draguima',
  title: {
    es: 'Draguima',
    en: 'Draguima',
  },
  tagline: {
    es: 'Generador de cartas de tarot dragones.',
    en: 'Dragon-themed tarot card generator.',
  },
  year: 2024,
  cover: './draguima.png',
  tags: ['Three.js', 'Vite'],
  url: 'https://draguima.example',
  order: 1,
} as const;

describe('sideProjectSchema', () => {
  it('parses a fully populated bilingual side project entry', () => {
    const parsed = sideProjectSchema.parse(validSideProject);
    expect(parsed.slug).toBe('draguima');
    expect(parsed.title.es).toBe('Draguima');
    expect(parsed.title.en).toBe('Draguima');
    expect(parsed.tagline.en).toBe('Dragon-themed tarot card generator.');
    expect(parsed.year).toBe(2024);
    expect(parsed.cover).toBe('./draguima.png');
    expect(parsed.tags).toHaveLength(2);
    expect(parsed.url).toBe('https://draguima.example');
    expect(parsed.order).toBe(1);
  });

  it('accepts url as null when the project has no external link', () => {
    const linkless = { ...validSideProject, url: null };
    const parsed = sideProjectSchema.parse(linkless);
    expect(parsed.url).toBeNull();
  });

  it('fails with a Zod error pointing at title.en when title only has es', () => {
    const incomplete = {
      ...validSideProject,
      title: { es: 'Draguima' },
    };
    const result = sideProjectSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTitleEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'title' && issue.path[1] === 'en',
    );
    expect(issuesOnTitleEn).toHaveLength(1);
  });

  it('fails with a Zod error pointing at tagline.en when tagline only has es', () => {
    const incomplete = {
      ...validSideProject,
      tagline: { es: 'Solo en español' },
    };
    const result = sideProjectSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTaglineEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'tagline' && issue.path[1] === 'en',
    );
    expect(issuesOnTaglineEn).toHaveLength(1);
  });

  it('rejects an extra unknown root key in strict mode and lists the key', () => {
    const withExtra: Record<string, unknown> = { ...validSideProject, featured: true };
    const result = sideProjectSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognizedKeyIssues = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' && Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognizedKeyIssues).toHaveLength(1);
    const firstUnrecognized = unrecognizedKeyIssues[0];
    if (firstUnrecognized === undefined) {
      throw new Error('expected one unrecognized_keys issue');
    }
    expect(firstUnrecognized.keys).toContain('featured');
  });

  it('rejects an empty slug string', () => {
    const empty = { ...validSideProject, slug: '' };
    const result = sideProjectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnSlug = result.error.issues.filter((issue) => issue.path.includes('slug'));
    expect(issuesOnSlug.length).toBeGreaterThan(0);
  });

  it('rejects a malformed url string', () => {
    const badUrl = { ...validSideProject, url: 'not a url' };
    const result = sideProjectSchema.safeParse(badUrl);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnUrl = result.error.issues.filter((issue) => issue.path.includes('url'));
    expect(issuesOnUrl.length).toBeGreaterThan(0);
  });
});
