import { describe, expect, it } from 'vitest';

import { projectSchema } from '@/lib/schemas/projects';

const validProject = {
  slug: 'made-by-apes',
  title: {
    es: 'Made by Apes (MBA)',
    en: 'Made by Apes (MBA)',
  },
  company: 'Yuga Labs',
  year: 2025,
  featured: true,
  tagline: {
    es: 'Plataforma de certificación on-chain para creadores BAYC.',
    en: 'On-chain certification platform for BAYC creators.',
  },
  description: {
    es: 'Lideré la entrega de la plataforma que permite a holders verificar y monetizar derechos de IP.',
    en: 'Led delivery of the platform letting holders verify and monetize IP rights.',
  },
  cover: './cover.png',
  tags: ['NestJS', 'AWS', 'EVM'],
  order: 1,
} as const;

describe('projectSchema', () => {
  it('parses a fully populated bilingual project entry', () => {
    const parsed = projectSchema.parse(validProject);
    expect(parsed.slug).toBe('made-by-apes');
    expect(parsed.title.es).toBe('Made by Apes (MBA)');
    expect(parsed.title.en).toBe('Made by Apes (MBA)');
    expect(parsed.company).toBe('Yuga Labs');
    expect(parsed.year).toBe(2025);
    expect(parsed.featured).toBe(true);
    expect(parsed.tagline.en).toBe('On-chain certification platform for BAYC creators.');
    expect(parsed.description.es).toBe(
      'Lideré la entrega de la plataforma que permite a holders verificar y monetizar derechos de IP.',
    );
    expect(parsed.description.en).toBe(
      'Led delivery of the platform letting holders verify and monetize IP rights.',
    );
    expect(parsed.cover).toBe('./cover.png');
    expect(parsed.tags).toHaveLength(3);
    expect(parsed.tags[0]).toBe('NestJS');
    expect(parsed.order).toBe(1);
  });

  it('fails with a Zod error pointing at title.en when title only has es', () => {
    const incomplete = {
      ...validProject,
      title: { es: 'Made by Apes (MBA)' },
    };
    const result = projectSchema.safeParse(incomplete);
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
      ...validProject,
      tagline: { es: 'Solo en español' },
    };
    const result = projectSchema.safeParse(incomplete);
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
    const withExtra: Record<string, unknown> = {
      ...validProject,
      repository: 'https://github.com',
    };
    const result = projectSchema.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('repository');
  });

  it('rejects an empty slug string', () => {
    const empty = { ...validProject, slug: '' };
    const result = projectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnSlug = result.error.issues.filter((issue) => issue.path.includes('slug'));
    expect(issuesOnSlug.length).toBeGreaterThan(0);
  });

  it('rejects a non-integer year', () => {
    const fractional = { ...validProject, year: 2025.5 };
    const result = projectSchema.safeParse(fractional);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnYear = result.error.issues.filter((issue) => issue.path.includes('year'));
    expect(issuesOnYear.length).toBeGreaterThan(0);
  });

  it('rejects tags as a non-array value', () => {
    const wrongTags: Record<string, unknown> = { ...validProject, tags: 'NestJS' };
    const result = projectSchema.safeParse(wrongTags);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTags = result.error.issues.filter((issue) => issue.path.includes('tags'));
    expect(issuesOnTags.length).toBeGreaterThan(0);
  });

  it('parses an entry with featured: false', () => {
    const notFeatured = { ...validProject, featured: false };
    const parsed = projectSchema.parse(notFeatured);
    expect(parsed.featured).toBe(false);
  });

  it('fails with a Zod error pointing at description.en when description only has es', () => {
    const incomplete = {
      ...validProject,
      description: { es: 'Solo descripción en español' },
    };
    const result = projectSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnDescriptionEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'description' && issue.path[1] === 'en',
    );
    expect(issuesOnDescriptionEn).toHaveLength(1);
  });

  it('fails when description is missing entirely', () => {
    const { description: _description, ...withoutDescription } = validProject;
    void _description;
    const result = projectSchema.safeParse(withoutDescription);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnDescription = result.error.issues.filter(
      (issue) => issue.path[0] === 'description',
    );
    expect(issuesOnDescription.length).toBeGreaterThan(0);
  });
});
