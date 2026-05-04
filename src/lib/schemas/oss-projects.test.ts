import { describe, expect, it } from 'vitest';

import { ossProjectSchema } from '@/lib/schemas/oss-projects';

const validOssProject = {
  org: 'jcocano',
  repo: 'pkmn-vgc-copilot',
  license: 'MIT',
  url: 'https://github.com/jcocano/pkmn-vgc-copilot',
  description: {
    es: 'Asistente para juego competitivo de Pokémon VGC.',
    en: 'Companion for competitive Pokémon VGC.',
  },
  languages: [
    { label: 'TypeScript', swatch: 'ts' },
    { label: 'VGC', swatch: '' },
  ],
  order: 1,
} as const;

describe('ossProjectSchema', () => {
  it('parses a fully populated bilingual oss project entry', () => {
    const parsed = ossProjectSchema.parse(validOssProject);
    expect(parsed.org).toBe('jcocano');
    expect(parsed.repo).toBe('pkmn-vgc-copilot');
    expect(parsed.license).toBe('MIT');
    expect(parsed.url).toBe('https://github.com/jcocano/pkmn-vgc-copilot');
    expect(parsed.description.es).toBe('Asistente para juego competitivo de Pokémon VGC.');
    expect(parsed.description.en).toBe('Companion for competitive Pokémon VGC.');
    expect(parsed.languages).toHaveLength(2);
    expect(parsed.languages[0]?.label).toBe('TypeScript');
    expect(parsed.languages[0]?.swatch).toBe('ts');
    expect(parsed.languages[1]?.label).toBe('VGC');
    expect(parsed.languages[1]?.swatch).toBe('');
    expect(parsed.order).toBe(1);
  });

  it('fails with a Zod error pointing at description.en when description only has es', () => {
    const incomplete = {
      ...validOssProject,
      description: { es: 'Solo en español' },
    };
    const result = ossProjectSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnDescriptionEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'description' && issue.path[1] === 'en',
    );
    expect(issuesOnDescriptionEn).toHaveLength(1);
  });

  it('rejects a malformed url string', () => {
    const badUrl = { ...validOssProject, url: 'not a url' };
    const result = ossProjectSchema.safeParse(badUrl);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnUrl = result.error.issues.filter((issue) => issue.path.includes('url'));
    expect(issuesOnUrl.length).toBeGreaterThan(0);
  });

  it('rejects an empty languages array (at least one language required)', () => {
    const noLanguages = { ...validOssProject, languages: [] };
    const result = ossProjectSchema.safeParse(noLanguages);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnLanguages = result.error.issues.filter((issue) => issue.path[0] === 'languages');
    expect(issuesOnLanguages.length).toBeGreaterThan(0);
  });

  it('rejects an extra unknown root key in strict mode and lists the key', () => {
    const withExtra: Record<string, unknown> = { ...validOssProject, glyph: '⊙' };
    const result = ossProjectSchema.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('glyph');
  });

  it('rejects an empty org string', () => {
    const empty = { ...validOssProject, org: '' };
    const result = ossProjectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrg = result.error.issues.filter((issue) => issue.path.includes('org'));
    expect(issuesOnOrg.length).toBeGreaterThan(0);
  });

  it('rejects an empty repo string', () => {
    const empty = { ...validOssProject, repo: '' };
    const result = ossProjectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRepo = result.error.issues.filter((issue) => issue.path.includes('repo'));
    expect(issuesOnRepo.length).toBeGreaterThan(0);
  });

  it('rejects an empty license string', () => {
    const empty = { ...validOssProject, license: '' };
    const result = ossProjectSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnLicense = result.error.issues.filter((issue) => issue.path.includes('license'));
    expect(issuesOnLicense.length).toBeGreaterThan(0);
  });

  it('rejects a language entry with an empty label', () => {
    const badLanguage = {
      ...validOssProject,
      languages: [{ label: '', swatch: 'ts' }],
    };
    const result = ossProjectSchema.safeParse(badLanguage);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnLabel = result.error.issues.filter(
      (issue) => issue.path[0] === 'languages' && issue.path.includes('label'),
    );
    expect(issuesOnLabel.length).toBeGreaterThan(0);
  });

  it('accepts a language entry with an empty swatch (default-color case)', () => {
    const defaultSwatch = {
      ...validOssProject,
      languages: [{ label: 'VGC', swatch: '' }],
    };
    const parsed = ossProjectSchema.parse(defaultSwatch);
    expect(parsed.languages).toHaveLength(1);
    expect(parsed.languages[0]?.swatch).toBe('');
  });

  it('rejects a non-integer order value', () => {
    const fractional = { ...validOssProject, order: 1.5 };
    const result = ossProjectSchema.safeParse(fractional);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
  });

  it('rejects an extra unknown key inside a language entry', () => {
    const withExtra = {
      ...validOssProject,
      languages: [{ label: 'TypeScript', swatch: 'ts', color: '#3178c6' }],
    };
    const result = ossProjectSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognizedKeyIssues = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' && Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognizedKeyIssues.length).toBeGreaterThan(0);
  });
});
