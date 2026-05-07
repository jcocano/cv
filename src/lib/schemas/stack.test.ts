import { describe, expect, it } from 'vitest';

import stackJson from '@/data/stack.json';
import { parseStackOrThrow, stackSchema } from '@/lib/schemas/stack';

const validStack = {
  categories: [
    {
      label: { es: 'Lenguajes', en: 'Languages' },
      tags: ['TypeScript', 'JavaScript'],
    },
    {
      label: { es: 'Frameworks', en: 'Frameworks' },
      tags: ['NestJS', 'React'],
    },
  ],
} as const;

describe('stackSchema', () => {
  it('parses a valid stack with categories that have label{es,en} and at least one tag each', () => {
    const parsed = stackSchema.parse(validStack);
    expect(parsed.categories).toHaveLength(2);
    expect(parsed.categories[0]?.label.es).toBe('Lenguajes');
    expect(parsed.categories[0]?.label.en).toBe('Languages');
    expect(parsed.categories[0]?.tags).toEqual(['TypeScript', 'JavaScript']);
    expect(parsed.categories[1]?.label.es).toBe('Frameworks');
    expect(parsed.categories[1]?.tags).toEqual(['NestJS', 'React']);
  });

  it('fails when a category has an empty tags array (at least one tag required)', () => {
    const broken = {
      categories: [{ label: { es: 'X', en: 'X' }, tags: [] }],
    };
    const result = stackSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const tagsIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'categories' && issue.path[1] === 0 && issue.path[2] === 'tags',
    );
    expect(tagsIssues).toHaveLength(1);
    expect(tagsIssues[0]?.code).toBe('too_small');
  });

  it('fails when label is missing the en key (i18n requires both languages)', () => {
    const broken = {
      categories: [{ label: { es: 'Lenguajes' }, tags: ['TypeScript'] }],
    };
    const result = stackSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const labelEnIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'categories' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'label' &&
        issue.path[3] === 'en',
    );
    expect(labelEnIssues).toHaveLength(1);
  });

  it('fails when label is missing the es key (i18n requires both languages)', () => {
    const broken = {
      categories: [{ label: { en: 'Languages' }, tags: ['TypeScript'] }],
    };
    const result = stackSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const labelEsIssues = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'categories' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'label' &&
        issue.path[3] === 'es',
    );
    expect(labelEsIssues).toHaveLength(1);
  });

  it('fails when categories is empty (at least one category required)', () => {
    const broken = { categories: [] };
    const result = stackSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const categoriesIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'categories' && issue.path.length === 1,
    );
    expect(categoriesIssues).toHaveLength(1);
    expect(categoriesIssues[0]?.code).toBe('too_small');
  });

  it('fails when a tag is the empty string', () => {
    const broken = {
      categories: [{ label: { es: 'X', en: 'X' }, tags: [''] }],
    };
    const result = stackSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const emptyTagIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'categories' && issue.path[1] === 0 && issue.path[2] === 'tags',
    );
    expect(emptyTagIssues.length).toBeGreaterThan(0);
  });

  it('parses the real src/data/stack.json with the seven handoff categories in order', () => {
    const parsed = stackSchema.parse(stackJson);
    expect(parsed.categories).toHaveLength(7);
    expect(parsed.categories[0]?.label.en).toBe('Languages');
    expect(parsed.categories[1]?.label.en).toBe('Frameworks');
    expect(parsed.categories[2]?.label.en).toBe('Cloud & DevOps');
    expect(parsed.categories[3]?.label.en).toBe('Messaging & Data');
    expect(parsed.categories[4]?.label.en).toBe('Tools');
    expect(parsed.categories[5]?.label.en).toBe('AI / LLMs');
    expect(parsed.categories[6]?.label.en).toBe('Specialization');
  });

  it('parses the real src/data/stack.json with the exact tag arrays from the handoff', () => {
    const parsed = stackSchema.parse(stackJson);
    expect(parsed.categories[0]?.tags).toEqual([
      'TypeScript',
      'JavaScript',
      'Rust',
      'Java',
      'C#',
      'Solidity',
      'SQL',
    ]);
    expect(parsed.categories[2]?.tags).toEqual([
      'AWS',
      'GCP',
      'Kubernetes',
      'Kustomize',
      'KSOPS',
      'Docker',
      'Terraform',
      'GitHub Actions',
    ]);
    expect(parsed.categories[3]?.tags).toEqual([
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'Apache Kafka',
      'Apache Pulsar',
      'Google Pub/Sub',
      'RabbitMQ',
      'Salesforce',
    ]);
    expect(parsed.categories[5]?.tags).toEqual([
      'Claude / Anthropic',
      'OpenAI',
      'Google (Gemini)',
      'OpenRouter',
      'Ollama / LM Studio',
      'MCP',
      'RAG',
      'Vector DBs (Qdrant)',
      'Function calling',
      'Agents',
    ]);
  });

  it('renders the same string for label.es and label.en in unilingual handoff categories (Frameworks, Cloud & DevOps, AI / LLMs)', () => {
    const parsed = stackSchema.parse(stackJson);
    expect(parsed.categories[1]?.label.es).toBe('Frameworks');
    expect(parsed.categories[1]?.label.en).toBe('Frameworks');
    expect(parsed.categories[2]?.label.es).toBe('Cloud & DevOps');
    expect(parsed.categories[2]?.label.en).toBe('Cloud & DevOps');
    expect(parsed.categories[5]?.label.es).toBe('AI / LLMs');
    expect(parsed.categories[5]?.label.en).toBe('AI / LLMs');
  });
});

describe('parseStackOrThrow', () => {
  it('returns the parsed stack from src/data/stack.json with seven categories', () => {
    const stack = parseStackOrThrow();
    expect(stack.categories).toHaveLength(7);
    expect(stack.categories[0]?.label.en).toBe('Languages');
    expect(stack.categories[6]?.label.en).toBe('Specialization');
  });

  it('returns a result whose tags arrays match the handoff exactly (Messaging & Data has 8 tags)', () => {
    const stack = parseStackOrThrow();
    expect(stack.categories[3]?.tags).toHaveLength(8);
    expect(stack.categories[4]?.tags).toEqual([
      'Git',
      'Prometheus',
      'Grafana',
      'ELK Stack',
      'JIRA · Agile',
    ]);
  });
});
