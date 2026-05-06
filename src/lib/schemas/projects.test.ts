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
  eyebrow: {
    es: 'proyecto destacado',
    en: 'featured project',
  },
  stack: ['TypeScript', 'NestJS', 'K8s', 'AWS', 'GCP'],
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
    expect(parsed.eyebrow.es).toBe('proyecto destacado');
    expect(parsed.eyebrow.en).toBe('featured project');
    expect(parsed.stack).toEqual(['TypeScript', 'NestJS', 'K8s', 'AWS', 'GCP']);
    expect(parsed.stack).toHaveLength(5);
    expect(parsed.stack[0]).toBe('TypeScript');
  });

  it('fails when eyebrow is missing entirely', () => {
    const { eyebrow: _eyebrow, ...withoutEyebrow } = validProject;
    void _eyebrow;
    const result = projectSchema.safeParse(withoutEyebrow);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEyebrow = result.error.issues.filter((issue) => issue.path[0] === 'eyebrow');
    expect(issuesOnEyebrow.length).toBeGreaterThan(0);
  });

  it('rejects an unknown role field (iter 5: role removed from schema)', () => {
    const withRole: Record<string, unknown> = {
      ...validProject,
      role: { es: 'Senior Backend', en: 'Senior Backend' },
    };
    const result = projectSchema.safeParse(withRole);
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
    expect(firstUnrecognized.keys).toContain('role');
  });

  it('fails when stack is missing entirely', () => {
    const { stack: _stack, ...withoutStack } = validProject;
    void _stack;
    const result = projectSchema.safeParse(withoutStack);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStack = result.error.issues.filter((issue) => issue.path[0] === 'stack');
    expect(issuesOnStack.length).toBeGreaterThan(0);
  });

  it('rejects an empty stack array (must contain at least one entry)', () => {
    const empty = { ...validProject, stack: [] };
    const result = projectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStack = result.error.issues.filter((issue) => issue.path[0] === 'stack');
    expect(issuesOnStack.length).toBeGreaterThan(0);
  });

  it('rejects a stack array containing an empty-string entry', () => {
    const blank = { ...validProject, stack: ['TypeScript', ''] };
    const result = projectSchema.safeParse(blank);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStackEntry = result.error.issues.filter(
      (issue) => issue.path[0] === 'stack' && issue.path[1] === 1,
    );
    expect(issuesOnStackEntry.length).toBeGreaterThan(0);
  });

  it('rejects a stack passed as a plain string (legacy shape)', () => {
    const legacy: Record<string, unknown> = {
      ...validProject,
      stack: 'TypeScript · NestJS',
    };
    const result = projectSchema.safeParse(legacy);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStack = result.error.issues.filter((issue) => issue.path[0] === 'stack');
    expect(issuesOnStack.length).toBeGreaterThan(0);
  });

  it('accepts a stack array of exactly one entry', () => {
    const one = { ...validProject, stack: ['Solidity'] };
    const parsed = projectSchema.parse(one);
    expect(parsed.stack).toEqual(['Solidity']);
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

  it('parses an entry with featured: false (and no order)', () => {
    const { order: _order, ...withoutOrder } = validProject;
    void _order;
    const notFeatured = { ...withoutOrder, featured: false };
    const parsed = projectSchema.parse(notFeatured);
    expect(parsed.featured).toBe(false);
    expect(parsed.order).toBeUndefined();
  });

  it('parses a featured entry with order in [1, 2, 3]', () => {
    const featuredTwo = { ...validProject, featured: true, order: 2 };
    const parsed = projectSchema.parse(featuredTwo);
    expect(parsed.featured).toBe(true);
    expect(parsed.order).toBe(2);
  });

  it('rejects a featured entry without order (refine cross-field)', () => {
    const { order: _order, ...withoutOrder } = validProject;
    void _order;
    const featuredNoOrder = { ...withoutOrder, featured: true };
    const result = projectSchema.safeParse(featuredNoOrder);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    expect(result.error.issues.length).toBeGreaterThan(0);
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
    expect(issuesOnOrder[0]?.message).toMatch(/order|featured/);
  });

  it('rejects a non-featured entry that has order set (refine cross-field)', () => {
    const notFeaturedWithOrder = { ...validProject, featured: false, order: 1 };
    const result = projectSchema.safeParse(notFeaturedWithOrder);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
  });

  it('rejects order = 0 (out of [1, 3] range) on a featured entry', () => {
    const featuredZero = { ...validProject, featured: true, order: 0 };
    const result = projectSchema.safeParse(featuredZero);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
  });

  it('rejects order = 4 (out of [1, 3] range) on a featured entry', () => {
    const featuredFour = { ...validProject, featured: true, order: 4 };
    const result = projectSchema.safeParse(featuredFour);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
  });

  it('rejects a non-integer order (1.5)', () => {
    const featuredFractional = { ...validProject, featured: true, order: 1.5 };
    const result = projectSchema.safeParse(featuredFractional);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
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
