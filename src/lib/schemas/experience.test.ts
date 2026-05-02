import { describe, expect, it } from 'vitest';

import { experienceSchema } from '@/lib/schemas/experience';

const validExperience = {
  company: 'Yuga Labs',
  role: {
    es: 'Senior Software Engineer – Backend & Platform',
    en: 'Senior Software Engineer – Backend & Platform',
  },
  location: {
    es: 'Remoto',
    en: 'Remote',
  },
  dateStart: '2024-12',
  dateEnd: '2026-02',
  order: 1,
  bullets: {
    es: ['Lideré la plataforma de backend.', 'Diseñé la arquitectura de eventos.'],
    en: ['Led the backend platform.', 'Designed the event-driven architecture.'],
  },
} as const;

describe('experienceSchema', () => {
  it('parses a fully populated bilingual experience entry', () => {
    const parsed = experienceSchema.parse(validExperience);
    expect(parsed.company).toBe('Yuga Labs');
    expect(parsed.role.es).toBe('Senior Software Engineer – Backend & Platform');
    expect(parsed.role.en).toBe('Senior Software Engineer – Backend & Platform');
    expect(parsed.location.en).toBe('Remote');
    expect(parsed.dateStart).toBe('2024-12');
    expect(parsed.dateEnd).toBe('2026-02');
    expect(parsed.order).toBe(1);
    expect(parsed.bullets.es).toHaveLength(2);
    expect(parsed.bullets.en).toHaveLength(2);
  });

  it('accepts dateEnd as null for current roles', () => {
    const current = { ...validExperience, dateEnd: null };
    const parsed = experienceSchema.parse(current);
    expect(parsed.dateEnd).toBeNull();
  });

  it('fails with a Zod error pointing at role.en when role only has es', () => {
    const incomplete = {
      ...validExperience,
      role: { es: 'Senior Software Engineer – Backend & Platform' },
    };
    const result = experienceSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRoleEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'role' && issue.path[1] === 'en',
    );
    expect(issuesOnRoleEn).toHaveLength(1);
  });

  it('fails with a Zod error pointing at bullets.en when bullets only has es', () => {
    const incomplete = {
      ...validExperience,
      bullets: { es: ['Solo en español'] },
    };
    const result = experienceSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnBulletsEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'bullets' && issue.path[1] === 'en',
    );
    expect(issuesOnBulletsEn).toHaveLength(1);
  });

  it('rejects an extra unknown root key in strict mode and lists the key', () => {
    const withExtra: Record<string, unknown> = { ...validExperience, salary: 100000 };
    const result = experienceSchema.safeParse(withExtra);
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
    expect(firstUnrecognized.keys).toContain('salary');
  });

  it('rejects an empty company string', () => {
    const empty = { ...validExperience, company: '' };
    const result = experienceSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnCompany = result.error.issues.filter((issue) => issue.path.includes('company'));
    expect(issuesOnCompany.length).toBeGreaterThan(0);
  });

  it('rejects a non-integer order', () => {
    const fractional = { ...validExperience, order: 1.5 };
    const result = experienceSchema.safeParse(fractional);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnOrder = result.error.issues.filter((issue) => issue.path.includes('order'));
    expect(issuesOnOrder.length).toBeGreaterThan(0);
  });
});
