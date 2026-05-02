import { describe, expect, it } from 'vitest';

import { i18nString, i18nStringArray } from '@/lib/schemas/i18n-string';

describe('i18nString', () => {
  it('parses an object with both es and en strings', () => {
    const parsed = i18nString.parse({ es: 'Hola', en: 'Hello' });
    expect(parsed.es).toBe('Hola');
    expect(parsed.en).toBe('Hello');
  });

  it('fails with a Zod error pointing at "en" when only es is provided', () => {
    const result = i18nString.safeParse({ es: 'Hola' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEn = result.error.issues.filter((issue) => issue.path.includes('en'));
    expect(issuesOnEn).toHaveLength(1);
  });

  it('fails with a Zod error pointing at "es" when only en is provided', () => {
    const result = i18nString.safeParse({ en: 'Hello' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEs = result.error.issues.filter((issue) => issue.path.includes('es'));
    expect(issuesOnEs).toHaveLength(1);
  });

  it('rejects an extra unknown key in strict mode', () => {
    const withExtra: Record<string, unknown> = { es: 'Hola', en: 'Hello', fr: 'Bonjour' };
    const result = i18nString.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('fr');
  });

  it('rejects a non-string value at es', () => {
    const withNumber: Record<string, unknown> = { es: 42, en: 'Hello' };
    const result = i18nString.safeParse(withNumber);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEs = result.error.issues.filter((issue) => issue.path.includes('es'));
    expect(issuesOnEs).toHaveLength(1);
  });
});

describe('i18nStringArray', () => {
  it('parses an object with both es and en arrays of strings', () => {
    const parsed = i18nStringArray.parse({
      es: ['Uno', 'Dos'],
      en: ['One', 'Two'],
    });
    expect(parsed.es).toHaveLength(2);
    expect(parsed.en).toHaveLength(2);
    expect(parsed.es[0]).toBe('Uno');
    expect(parsed.en[1]).toBe('Two');
  });

  it('parses empty arrays for both languages', () => {
    const parsed = i18nStringArray.parse({ es: [], en: [] });
    expect(parsed.es).toHaveLength(0);
    expect(parsed.en).toHaveLength(0);
  });

  it('fails with a Zod error pointing at "en" when only es is provided', () => {
    const result = i18nStringArray.safeParse({ es: ['Uno'] });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEn = result.error.issues.filter((issue) => issue.path.includes('en'));
    expect(issuesOnEn).toHaveLength(1);
  });

  it('rejects an extra unknown key in strict mode', () => {
    const withExtra: Record<string, unknown> = {
      es: ['Uno'],
      en: ['One'],
      fr: ['Un'],
    };
    const result = i18nStringArray.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('fr');
  });

  it('rejects a non-string element inside the es array', () => {
    const withNumberInside: Record<string, unknown> = {
      es: ['Uno', 99],
      en: ['One', 'Two'],
    };
    const result = i18nStringArray.safeParse(withNumberInside);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEsIndex1 = result.error.issues.filter(
      (issue) => issue.path[0] === 'es' && issue.path[1] === 1,
    );
    expect(issuesOnEsIndex1).toHaveLength(1);
  });
});
