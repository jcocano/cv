import { describe, expect, it } from 'vitest';

import aiReadyJson from '@/data/ai-ready.json';
import { aiReadySchema } from '@/lib/schemas/ai-ready';

const validAiReady = {
  title: {
    es: 'AI-native\npor defecto.',
    en: 'AI-native\nby default.',
  },
  lede: {
    es: 'Aplicando IA en mi flujo diario y construyendo sistemas backend pensados para integrarse con LLMs, agentes y pipelines de datos modernos.',
    en: 'Using AI in my daily workflow and architecting backend systems designed to integrate with LLMs, agents, and modern data pipelines.',
  },
  cards: [
    {
      iconKey: 'assistedDev',
      title: { es: 'Desarrollo asistido', en: 'AI-assisted dev' },
      body: {
        es: 'Claude Code, Cursor y Copilot integrados en mi loop diario.',
        en: 'Claude Code, Cursor, and Copilot integrated into my daily loop.',
      },
      tags: ['Claude Code', 'Cursor', 'Copilot'],
    },
    {
      iconKey: 'llmBackends',
      title: { es: 'Backends para LLMs', en: 'LLM backends' },
      body: {
        es: 'Diseño de APIs y servicios pensados para LLMs.',
        en: 'API and service design built for LLMs.',
      },
      tags: ['RAG', 'Vector DBs', 'Streaming', 'Function calling'],
    },
    {
      iconKey: 'agentsMcp',
      title: { es: 'Agentes y MCP', en: 'Agents & MCP' },
      body: {
        es: 'Construcción de agentes con tools, memory y orquestación.',
        en: 'Building agents with tools, memory, and orchestration.',
      },
      tags: ['MCP', 'Agents', 'Tool use', 'Orchestration'],
    },
  ],
  myTake: {
    es: 'Mi enfoque: la IA es una capa más del stack — se diseña, se observa y se escala como cualquier otro sistema en producción.',
    en: 'My take: AI is just another layer of the stack — designed, observed, and scaled like any other production system.',
  },
} as const;

describe('aiReadySchema', () => {
  it('parses a fully populated bilingual ai-ready singleton with three cards', () => {
    const parsed = aiReadySchema.parse(validAiReady);
    expect(parsed.title.es.startsWith('AI-native')).toBe(true);
    expect(parsed.title.en.endsWith('by default.')).toBe(true);
    expect(parsed.lede.es.startsWith('Aplicando IA')).toBe(true);
    expect(parsed.cards).toHaveLength(3);
    expect(parsed.cards[0]?.iconKey).toBe('assistedDev');
    expect(parsed.cards[1]?.iconKey).toBe('llmBackends');
    expect(parsed.cards[2]?.iconKey).toBe('agentsMcp');
    expect(parsed.cards[0]?.tags).toEqual(['Claude Code', 'Cursor', 'Copilot']);
    expect(parsed.myTake.es.startsWith('Mi enfoque')).toBe(true);
    expect(parsed.myTake.en.startsWith('My take')).toBe(true);
  });

  it('fails when cards has fewer than three entries', () => {
    const broken = { ...validAiReady, cards: validAiReady.cards.slice(0, 2) };
    const result = aiReadySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnCards = result.error.issues.filter((issue) => issue.path[0] === 'cards');
    expect(issuesOnCards).toHaveLength(1);
    const firstIssue = issuesOnCards[0];
    if (firstIssue === undefined) {
      throw new Error('expected one issue on cards');
    }
    expect(firstIssue.code).toBe('too_small');
  });

  it('fails when title is missing the en key', () => {
    const broken = {
      ...validAiReady,
      title: { es: 'AI-native\npor defecto.' },
    };
    const result = aiReadySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTitleEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'title' && issue.path[1] === 'en',
    );
    expect(issuesOnTitleEn).toHaveLength(1);
  });

  it('fails when a card has an unknown iconKey (enum validation)', () => {
    const broken = {
      ...validAiReady,
      cards: [
        {
          ...validAiReady.cards[0],
          iconKey: 'unknownIcon',
        },
        validAiReady.cards[1],
        validAiReady.cards[2],
      ],
    };
    const result = aiReadySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnIconKey = result.error.issues.filter(
      (issue) => issue.path[0] === 'cards' && issue.path[1] === 0 && issue.path[2] === 'iconKey',
    );
    expect(issuesOnIconKey.length).toBeGreaterThan(0);
  });

  it('fails when a card has tags as an empty array', () => {
    const broken = {
      ...validAiReady,
      cards: [{ ...validAiReady.cards[0], tags: [] }, validAiReady.cards[1], validAiReady.cards[2]],
    };
    const result = aiReadySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnTags = result.error.issues.filter(
      (issue) => issue.path[0] === 'cards' && issue.path[1] === 0 && issue.path[2] === 'tags',
    );
    expect(issuesOnTags).toHaveLength(1);
    const firstIssue = issuesOnTags[0];
    if (firstIssue === undefined) {
      throw new Error('expected one issue on tags');
    }
    expect(firstIssue.code).toBe('too_small');
  });

  it('rejects an extra unknown root key in strict mode', () => {
    const withExtra: Record<string, unknown> = {
      ...validAiReady,
      twitter: 'https://x.com/jcocano',
    };
    const result = aiReadySchema.safeParse(withExtra);
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

  it('fails when a card body is missing the es key', () => {
    const broken = {
      ...validAiReady,
      cards: [
        {
          ...validAiReady.cards[0],
          body: { en: 'Only English here.' },
        },
        validAiReady.cards[1],
        validAiReady.cards[2],
      ],
    };
    const result = aiReadySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnBodyEs = result.error.issues.filter(
      (issue) =>
        issue.path[0] === 'cards' &&
        issue.path[1] === 0 &&
        issue.path[2] === 'body' &&
        issue.path[3] === 'es',
    );
    expect(issuesOnBodyEs).toHaveLength(1);
  });

  it('parses the real src/data/ai-ready.json singleton', () => {
    const parsed = aiReadySchema.parse(aiReadyJson);
    expect(parsed.cards).toHaveLength(3);
    expect(parsed.cards[0]?.tags.length).toBeGreaterThan(0);
    expect(parsed.cards[1]?.tags.length).toBeGreaterThan(0);
    expect(parsed.cards[2]?.tags.length).toBeGreaterThan(0);
    expect(parsed.myTake.es.length).toBeGreaterThan(0);
    expect(parsed.myTake.en.length).toBeGreaterThan(0);
  });
});
