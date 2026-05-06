import { describe, expect, it } from 'vitest';

import summaryJson from '@/data/summary.json';
import { summarySchema } from '@/lib/schemas/summary';

const validSummary = {
  title: {
    es: 'Backend profundo,\ninfraestructura más profunda.',
    en: 'Deep backend,\ndeeper infrastructure.',
  },
  lede: {
    es: '8 años de ingeniería de backend sobre 12 años trabajando con sistemas.',
    en: '8 years of backend engineering on top of 12 years working with systems.',
  },
  stats: [
    {
      value: '8',
      accent: '+',
      label: {
        es: 'años en backend distribuido',
        en: 'years in distributed backend',
      },
    },
    {
      value: '12',
      accent: '+',
      label: {
        es: 'años de base en sysadmin & redes',
        en: 'years of sysadmin & networking foundation',
      },
    },
    {
      value: '∞',
      accent: null,
      label: {
        es: 'stacks de mensajería en producción',
        en: 'messaging stacks in production',
      },
    },
  ],
  paragraphs: {
    es: ['Combina profundidad en backend con experiencia en infraestructura.'],
    en: ['Combines strong backend engineering with deep infrastructure expertise.'],
  },
  expertise: {
    es: ['Sistemas backend cloud-native', 'Microservicios event-driven'],
    en: ['Cloud-native backend systems', 'Event-driven microservices'],
  },
} as const;

describe('summarySchema', () => {
  it('parses a fully populated bilingual summary singleton', () => {
    const parsed = summarySchema.parse(validSummary);
    expect(parsed.title.es.startsWith('Backend profundo')).toBe(true);
    expect(parsed.title.en.startsWith('Deep backend')).toBe(true);
    expect(parsed.lede.es.startsWith('8 años')).toBe(true);
    expect(parsed.lede.en.startsWith('8 years')).toBe(true);
    expect(parsed.stats).toHaveLength(3);
    expect(parsed.stats[0]?.value).toBe('8');
    expect(parsed.stats[0]?.accent).toBe('+');
    expect(parsed.stats[2]?.value).toBe('∞');
    expect(parsed.stats[2]?.accent).toBeNull();
    expect(parsed.paragraphs.es).toHaveLength(1);
    expect(parsed.paragraphs.en).toHaveLength(1);
    expect(parsed.expertise.es).toHaveLength(2);
    expect(parsed.expertise.en).toHaveLength(2);
  });

  it('fails with a Zod error pointing at stats when the array is empty', () => {
    const empty = { ...validSummary, stats: [] };
    const result = summarySchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStats = result.error.issues.filter((issue) => issue.path[0] === 'stats');
    expect(issuesOnStats).toHaveLength(1);
    const firstIssue = issuesOnStats[0];
    if (firstIssue === undefined) {
      throw new Error('expected one issue on stats');
    }
    expect(firstIssue.code).toBe('too_small');
  });

  it('fails with a Zod error pointing at paragraphs.en when only es is provided', () => {
    const incomplete = {
      ...validSummary,
      paragraphs: { es: ['Solo en español.'] },
    };
    const result = summarySchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'paragraphs' && issue.path[1] === 'en',
    );
    expect(issuesOnEn).toHaveLength(1);
  });

  it('rejects an extra unknown root key in strict mode', () => {
    const withExtra: Record<string, unknown> = {
      ...validSummary,
      twitter: 'https://x.com/jcocano',
    };
    const result = summarySchema.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('twitter');
  });

  it('fails when a stat is missing the en label', () => {
    const broken = {
      ...validSummary,
      stats: [
        {
          value: '7',
          accent: '+',
          label: { es: 'años en sistemas distribuidos' },
        },
        ...validSummary.stats.slice(1),
      ],
    };
    const result = summarySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStatLabelEn = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'stats' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'label' &&
        issue.path[3] === 'en',
    );
    expect(issuesOnStatLabelEn).toHaveLength(1);
  });

  it('rejects a stat with an extra unknown key in strict mode', () => {
    const broken = {
      ...validSummary,
      stats: [
        {
          value: '7',
          accent: '+',
          label: { es: 'años en sistemas distribuidos', en: 'years in distributed systems' },
          color: 'red',
        },
        ...validSummary.stats.slice(1),
      ],
    };
    const result = summarySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognizedOnStat = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' &&
        issue.path[0] === 'stats' &&
        issue.path[1] === 0 &&
        Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognizedOnStat).toHaveLength(1);
  });

  it('accepts a stat with accent as null (e.g. ∞ has no accent symbol)', () => {
    const onlyInfinity = {
      ...validSummary,
      stats: [
        {
          value: '∞',
          accent: null,
          label: {
            es: 'eventos procesados (Kafka · Pulsar)',
            en: 'events shipped (Kafka · Pulsar)',
          },
        },
      ],
    };
    const parsed = summarySchema.parse(onlyInfinity);
    expect(parsed.stats[0]?.accent).toBeNull();
    expect(parsed.stats[0]?.value).toBe('∞');
  });

  it('rejects a stat where accent is a number instead of string|null', () => {
    const broken = {
      ...validSummary,
      stats: [
        {
          value: '7',
          accent: 7,
          label: { es: 'años en sistemas distribuidos', en: 'years in distributed systems' },
        },
        ...validSummary.stats.slice(1),
      ],
    };
    const result = summarySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnStatAccent = result.error.issues.filter(
      (issue) => issue.path[0] === 'stats' && issue.path[1] === 0 && issue.path[2] === 'accent',
    );
    expect(issuesOnStatAccent.length).toBeGreaterThan(0);
  });

  it('parses the real src/data/summary.json singleton', () => {
    const parsed = summarySchema.parse(summaryJson);
    expect(parsed.stats.length).toBeGreaterThan(0);
    expect(parsed.paragraphs.es.length).toBeGreaterThan(0);
    expect(parsed.paragraphs.en.length).toBeGreaterThan(0);
    expect(parsed.expertise.es.length).toBeGreaterThan(0);
    expect(parsed.expertise.en.length).toBeGreaterThan(0);
  });
});
