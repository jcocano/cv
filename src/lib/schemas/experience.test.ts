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
  description: {
    es: 'Diseño y evolución de servicios backend distribuidos.',
    en: 'Designed and evolved distributed backend services.',
  },
  tags: ['TypeScript', 'NestJS', 'Kubernetes'],
  displayDate: {
    es: 'Dic 2024 → Feb 2026',
    en: 'Dec 2024 → Feb 2026',
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
    expect(parsed.description.es).toBe('Diseño y evolución de servicios backend distribuidos.');
    expect(parsed.description.en).toBe('Designed and evolved distributed backend services.');
    expect(parsed.tags).toEqual(['TypeScript', 'NestJS', 'Kubernetes']);
    expect(parsed.displayDate?.es).toBe('Dic 2024 → Feb 2026');
    expect(parsed.displayDate?.en).toBe('Dec 2024 → Feb 2026');
  });

  it('accepts dateEnd as null for current roles', () => {
    const current = { ...validExperience, dateEnd: null };
    const parsed = experienceSchema.parse(current);
    expect(parsed.dateEnd).toBeNull();
  });

  it('accepts an entry without displayDate (the field is optional)', () => {
    const { displayDate: _displayDate, ...withoutDisplayDate } = validExperience;
    void _displayDate;
    const parsed = experienceSchema.parse(withoutDisplayDate);
    expect(parsed.displayDate).toBeUndefined();
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

  it('fails when description only has es (description.en is required)', () => {
    const incomplete = {
      ...validExperience,
      description: { es: 'Solo en español.' },
    };
    const result = experienceSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnDescriptionEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'description' && issue.path[1] === 'en',
    );
    expect(issuesOnDescriptionEn).toHaveLength(1);
  });

  it('rejects an empty tags array (min 1 required)', () => {
    const empty = { ...validExperience, tags: [] };
    const result = experienceSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTags = result.error.issues.filter((issue) => issue.path[0] === 'tags');
    expect(issuesOnTags.length).toBeGreaterThan(0);
  });

  it('rejects displayDate with only one language present', () => {
    const partial = {
      ...validExperience,
      displayDate: { es: 'Dic 2024 → Feb 2026' },
    };
    const result = experienceSchema.safeParse(partial);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnDisplayDateEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'displayDate' && issue.path[1] === 'en',
    );
    expect(issuesOnDisplayDateEn).toHaveLength(1);
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
