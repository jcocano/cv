import { describe, expect, it } from 'vitest';

import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import { designSystemDecisionsSchema } from '@/lib/schemas/design-system-decisions';

const validDecisions = {
  decisions: [
    {
      id: 'token-set-extended',
      title: { es: 'Set extendido de 11 tokens', en: 'Extended set of 11 tokens' },
      rationale: {
        es: 'Cubre superficies, texto, líneas y acento en lugar de un set mínimo.',
        en: 'Covers surfaces, text, lines and accent rather than a minimal set.',
      },
    },
    {
      id: 'geist-fontsource',
      title: { es: 'Geist vía @fontsource', en: 'Geist via @fontsource' },
      rationale: {
        es: 'Self-host evita Google Fonts en runtime.',
        en: 'Self-host avoids Google Fonts at runtime.',
      },
    },
  ],
} as const;

describe('designSystemDecisionsSchema', () => {
  it('parses a valid set with two unique decisions', () => {
    const parsed = designSystemDecisionsSchema.parse(validDecisions);
    expect(parsed.decisions).toHaveLength(2);
    expect(parsed.decisions[0]?.id).toBe('token-set-extended');
    expect(parsed.decisions[0]?.title.es).toBe('Set extendido de 11 tokens');
    expect(parsed.decisions[0]?.title.en).toBe('Extended set of 11 tokens');
    expect(parsed.decisions[1]?.id).toBe('geist-fontsource');
  });

  it('fails when decisions has zero entries (min: 1 required)', () => {
    const broken = { decisions: [] };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const decisionsIssues = result.error.issues.filter((issue) => issue.path[0] === 'decisions');
    expect(decisionsIssues).toHaveLength(1);
    expect(decisionsIssues[0]?.code).toBe('too_small');
  });

  it('fails when a decision rationale is missing the en key (parity)', () => {
    const broken = {
      decisions: [
        {
          ...validDecisions.decisions[0],
          rationale: { es: 'Solo español, falta inglés.' },
        },
      ],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const enIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'decisions' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'rationale' &&
        issue.path[3] === 'en',
    );
    expect(enIssues).toHaveLength(1);
  });

  it('rejects an extra unknown field on a decision in strict mode', () => {
    const decisionsWithExtra: Array<Record<string, unknown>> = [
      { ...validDecisions.decisions[0], extraField: 'nope' },
    ];
    const broken: Record<string, unknown> = { decisions: decisionsWithExtra };
    const result = designSystemDecisionsSchema.safeParse(broken);
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

  it('fails when a decision id has uppercase letters (kebab-case only)', () => {
    const broken = {
      decisions: [{ ...validDecisions.decisions[0], id: 'Token-Set-Extended' }],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const idIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'decisions' && issue.path[1] === 0 && issue.path[2] === 'id',
    );
    expect(idIssues.length).toBeGreaterThan(0);
    expect(idIssues[0]?.message.toLowerCase()).toContain('kebab-case');
  });

  it('fails when a decision id uses an underscore (kebab-case only)', () => {
    const broken = {
      decisions: [{ ...validDecisions.decisions[0], id: 'token_set' }],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const idIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'decisions' && issue.path[1] === 0 && issue.path[2] === 'id',
    );
    expect(idIssues.length).toBeGreaterThan(0);
  });

  it('parses the real src/data/design-system-decisions.json', () => {
    const parsed = designSystemDecisionsSchema.parse(designSystemDecisionsJson);
    expect(parsed.decisions.length).toBeGreaterThanOrEqual(6);
    expect(parsed.decisions.length).toBeLessThanOrEqual(8);
    const ids = parsed.decisions.map((decision) => decision.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('fails when two decisions share the same id (no duplicates allowed)', () => {
    const broken = {
      decisions: [
        validDecisions.decisions[0],
        { ...validDecisions.decisions[1], id: 'token-set-extended' },
      ],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const duplicateIssues = result.error.issues.filter((issue) =>
      issue.message.toLowerCase().includes('unique'),
    );
    expect(duplicateIssues.length).toBeGreaterThan(0);
  });

  it('parses an entry that includes the optional alternatives_rejected field (positive)', () => {
    const withAlternatives = {
      decisions: [
        {
          id: 'astro-not-next',
          title: { es: 'Astro y no Next.js', en: 'Astro instead of Next.js' },
          rationale: {
            es: 'Sitio mayoritariamente estático, mejor MPA con islas.',
            en: 'Mostly static site, MPA with islands is a better fit.',
          },
          alternatives_rejected: {
            es: 'Next.js arrastra runtime React; Remix asume servidor.',
            en: 'Next.js drags a React runtime; Remix assumes a server.',
          },
        },
      ],
    };
    const parsed = designSystemDecisionsSchema.parse(withAlternatives);
    expect(parsed.decisions).toHaveLength(1);
    const entry = parsed.decisions[0];
    if (entry === undefined) {
      throw new Error('expected one decision');
    }
    expect(entry.alternatives_rejected?.es).toBe(
      'Next.js arrastra runtime React; Remix asume servidor.',
    );
    expect(entry.alternatives_rejected?.en).toBe(
      'Next.js drags a React runtime; Remix assumes a server.',
    );
  });

  it('parses an entry without alternatives_rejected (optional, backward compatible)', () => {
    const withoutAlternatives = {
      decisions: [validDecisions.decisions[0]],
    };
    const parsed = designSystemDecisionsSchema.parse(withoutAlternatives);
    expect(parsed.decisions).toHaveLength(1);
    const entry = parsed.decisions[0];
    if (entry === undefined) {
      throw new Error('expected one decision');
    }
    expect(entry.alternatives_rejected).toBeUndefined();
  });

  it('fails when alternatives_rejected has only es (parity required for the new field)', () => {
    const broken = {
      decisions: [
        {
          ...validDecisions.decisions[0],
          alternatives_rejected: { es: 'Solo español, falta inglés.' },
        },
      ],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const enIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'decisions' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'alternatives_rejected' &&
        issue.path[3] === 'en',
    );
    expect(enIssues).toHaveLength(1);
  });

  it('parses an entry that includes the optional eyebrow field (positive)', () => {
    const withEyebrow = {
      decisions: [
        {
          ...validDecisions.decisions[0],
          eyebrow: { es: 'tokens', en: 'tokens' },
        },
      ],
    };
    const parsed = designSystemDecisionsSchema.parse(withEyebrow);
    const entry = parsed.decisions[0];
    if (entry === undefined) {
      throw new Error('expected one decision');
    }
    expect(entry.eyebrow?.es).toBe('tokens');
    expect(entry.eyebrow?.en).toBe('tokens');
  });

  it('parses an entry without eyebrow (optional, backward compatible)', () => {
    const parsed = designSystemDecisionsSchema.parse(validDecisions);
    const entry = parsed.decisions[0];
    if (entry === undefined) {
      throw new Error('expected one decision');
    }
    expect(entry.eyebrow).toBeUndefined();
  });

  it('fails when eyebrow has only en (parity required when present)', () => {
    const broken = {
      decisions: [
        {
          ...validDecisions.decisions[0],
          eyebrow: { en: 'only english' },
        },
      ],
    };
    const result = designSystemDecisionsSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const esIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'decisions' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'eyebrow' &&
        issue.path[3] === 'es',
    );
    expect(esIssues).toHaveLength(1);
  });
});
