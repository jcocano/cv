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
  role: {
    es: 'Technology Partner & Co-Founder',
    en: 'Technology Partner & Co-Founder',
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
    expect(parsed.role.es).toBe('Technology Partner & Co-Founder');
    expect(parsed.role.en).toBe('Technology Partner & Co-Founder');
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

  it('parses a valid side project without a cover (cover is optional)', () => {
    const { cover: _cover, ...withoutCover } = validSideProject;
    void _cover;
    const parsed = sideProjectSchema.parse(withoutCover);
    expect(parsed.cover).toBeUndefined();
    expect(parsed.slug).toBe('draguima');
  });

  it('fails with a Zod error pointing at role.en when role only has es', () => {
    const incomplete = {
      ...validSideProject,
      role: { es: 'Solo en español' },
    };
    const result = sideProjectSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRoleEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'role' && issue.path[1] === 'en',
    );
    expect(issuesOnRoleEn).toHaveLength(1);
  });

  it('fails when role is missing entirely', () => {
    const { role: _role, ...withoutRole } = validSideProject;
    void _role;
    const result = sideProjectSchema.safeParse(withoutRole);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRole = result.error.issues.filter((issue) => issue.path[0] === 'role');
    expect(issuesOnRole.length).toBeGreaterThan(0);
  });
});
