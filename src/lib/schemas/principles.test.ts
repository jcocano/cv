import { describe, expect, it } from 'vitest';

import principlesJson from '@/data/principles.json';
import { principlesSchema } from '@/lib/schemas/principles';

const validPrinciples = {
  principles: [
    {
      id: 'tests-document-intent',
      title: { es: 'Tests documentan intención', en: 'Tests document intent' },
      statement: {
        es: 'Un test sin asserts concretos no documenta nada.',
        en: 'A test without concrete asserts documents nothing.',
      },
    },
    {
      id: 'fail-loud-fail-early',
      title: { es: 'Fallar fuerte, fallar pronto', en: 'Fail loud, fail early' },
      statement: {
        es: 'El silencio se paga después con un bug en producción.',
        en: 'Silence is paid for later with a bug in production.',
      },
    },
  ],
} as const;

describe('principlesSchema', () => {
  it('parses a valid set with two unique principles', () => {
    const parsed = principlesSchema.parse(validPrinciples);
    expect(parsed.principles).toHaveLength(2);
    expect(parsed.principles[0]?.id).toBe('tests-document-intent');
    expect(parsed.principles[0]?.title.es).toBe('Tests documentan intención');
    expect(parsed.principles[0]?.title.en).toBe('Tests document intent');
    expect(parsed.principles[1]?.id).toBe('fail-loud-fail-early');
  });

  it('fails when principles has zero entries (min: 1 required)', () => {
    const broken = { principles: [] };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const principlesIssues = result.error.issues.filter((issue) => issue.path[0] === 'principles');
    expect(principlesIssues).toHaveLength(1);
    expect(principlesIssues[0]?.code).toBe('too_small');
  });

  it('fails when a principle statement is missing the en key (parity)', () => {
    const broken = {
      principles: [
        {
          ...validPrinciples.principles[0],
          statement: { es: 'Solo español, falta inglés.' },
        },
      ],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const enIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'principles' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'statement' &&
        issue.path[3] === 'en',
    );
    expect(enIssues).toHaveLength(1);
  });

  it('fails when a principle title is missing the es key (parity)', () => {
    const broken = {
      principles: [
        {
          ...validPrinciples.principles[0],
          title: { en: 'Only English, missing Spanish.' },
        },
      ],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const esIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'principles' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'title' &&
        issue.path[3] === 'es',
    );
    expect(esIssues).toHaveLength(1);
  });

  it('rejects an extra unknown field on a principle in strict mode', () => {
    const principlesWithExtra: Array<Record<string, unknown>> = [
      { ...validPrinciples.principles[0], extraField: 'nope' },
    ];
    const broken: Record<string, unknown> = { principles: principlesWithExtra };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognized = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' && Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognized.length).toBeGreaterThan(0);
    expect(unrecognized[0]?.keys).toContain('extraField');
  });

  it('rejects an extra unknown field at the top level in strict mode', () => {
    const broken: Record<string, unknown> = {
      principles: [validPrinciples.principles[0]],
      extraTopLevel: 'nope',
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognized = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' && Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognized.length).toBeGreaterThan(0);
    expect(unrecognized[0]?.keys).toContain('extraTopLevel');
  });

  it('fails when a principle id has uppercase letters (kebab-case only)', () => {
    const broken = {
      principles: [{ ...validPrinciples.principles[0], id: 'Tests-Document-Intent' }],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const idIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'principles' && issue.path[1] === 0 && issue.path[2] === 'id',
    );
    expect(idIssues.length).toBeGreaterThan(0);
    expect(idIssues[0]?.message.toLowerCase()).toContain('kebab-case');
  });

  it('fails when a principle id uses an underscore (kebab-case only)', () => {
    const broken = {
      principles: [{ ...validPrinciples.principles[0], id: 'tests_document_intent' }],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const idIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'principles' && issue.path[1] === 0 && issue.path[2] === 'id',
    );
    expect(idIssues.length).toBeGreaterThan(0);
  });

  it('fails when a principle id starts with a digit (kebab-case must start with letter)', () => {
    const broken = {
      principles: [{ ...validPrinciples.principles[0], id: '1-tests-document-intent' }],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const idIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'principles' && issue.path[1] === 0 && issue.path[2] === 'id',
    );
    expect(idIssues.length).toBeGreaterThan(0);
  });

  it('fails when two principles share the same id (no duplicates allowed)', () => {
    const broken = {
      principles: [
        validPrinciples.principles[0],
        { ...validPrinciples.principles[1], id: 'tests-document-intent' },
      ],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const duplicateIssues = result.error.issues.filter((issue) =>
      issue.message.toLowerCase().includes('unique'),
    );
    expect(duplicateIssues.length).toBeGreaterThan(0);
  });

  it('parses the real src/data/principles.json file', () => {
    const parsed = principlesSchema.parse(principlesJson);
    expect(parsed.principles.length).toBeGreaterThanOrEqual(1);
    const ids = parsed.principles.map((principle) => principle.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('parses an entry that includes the optional eyebrow field (positive)', () => {
    const withEyebrow = {
      principles: [
        {
          ...validPrinciples.principles[0],
          eyebrow: { es: 'tipos', en: 'types' },
        },
      ],
    };
    const parsed = principlesSchema.parse(withEyebrow);
    const entry = parsed.principles[0];
    if (entry === undefined) {
      throw new Error('expected one principle');
    }
    expect(entry.eyebrow?.es).toBe('tipos');
    expect(entry.eyebrow?.en).toBe('types');
  });

  it('parses an entry without eyebrow (optional, backward compatible)', () => {
    const parsed = principlesSchema.parse(validPrinciples);
    const entry = parsed.principles[0];
    if (entry === undefined) {
      throw new Error('expected one principle');
    }
    expect(entry.eyebrow).toBeUndefined();
  });

  it('fails when eyebrow has only es (parity required when present)', () => {
    const broken = {
      principles: [
        {
          ...validPrinciples.principles[0],
          eyebrow: { es: 'solo es' },
        },
      ],
    };
    const result = principlesSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const enIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'principles' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'eyebrow' &&
        issue.path[3] === 'en',
    );
    expect(enIssues).toHaveLength(1);
  });
});
