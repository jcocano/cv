import { describe, expect, it } from 'vitest';

import heroJson from '@/data/hero.json';
import { heroSchema } from '@/lib/schemas/hero';

const validHero = {
  name: 'Jesús Cocaño',
  role: {
    es: 'Senior Backend & Platform Engineer',
    en: 'Senior Backend & Platform Engineer',
  },
  pitch: {
    es: 'Senior Backend & Platform Engineer construyendo sistemas distribuidos resilientes — desde arquitecturas early-stage hasta plataformas de alto tráfico en producción.',
    en: 'Senior Backend & Platform Engineer building resilient distributed systems — from early-stage architectures to high-traffic production platforms.',
  },
  location: {
    es: 'México · Remoto',
    en: 'Mexico · Remote',
  },
  status: {
    es: 'Disponible para oportunidades',
    en: 'Available for opportunities',
  },
  roleShort: 'Backend / Platform / SRE',
  aiTopics: {
    es: 'LLMs · RAG · Agentes · MCP',
    en: 'LLMs · RAG · Agents · MCP',
  },
  links: {
    email: 'mailto:jesus.cocano@gmail.com',
    github: 'https://github.com/jcocano',
    linkedin: 'https://linkedin.com/in/jcocano',
  },
} as const;

describe('heroSchema', () => {
  it('parses a fully populated bilingual hero singleton', () => {
    const parsed = heroSchema.parse(validHero);
    expect(parsed.name).toBe('Jesús Cocaño');
    expect(parsed.role.es).toBe('Senior Backend & Platform Engineer');
    expect(parsed.role.en).toBe('Senior Backend & Platform Engineer');
    expect(parsed.pitch.es.startsWith('Senior Backend & Platform Engineer construyendo')).toBe(
      true,
    );
    expect(parsed.pitch.en.startsWith('Senior Backend & Platform Engineer building')).toBe(true);
    expect(parsed.location.es).toBe('México · Remoto');
    expect(parsed.status.en).toBe('Available for opportunities');
    expect(parsed.roleShort).toBe('Backend / Platform / SRE');
    expect(parsed.aiTopics.en).toBe('LLMs · RAG · Agents · MCP');
    expect(parsed.links.email).toBe('mailto:jesus.cocano@gmail.com');
    expect(parsed.links.github).toBe('https://github.com/jcocano');
    expect(parsed.links.linkedin).toBe('https://linkedin.com/in/jcocano');
  });

  it('fails with a Zod error pointing at role.en when role only has es', () => {
    const incomplete = {
      ...validHero,
      role: { es: 'Senior Backend & Platform Engineer' },
    };
    const result = heroSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRoleEn = result.error.issues.filter(
      (issue) => issue.path[0] === 'role' && issue.path[1] === 'en',
    );
    expect(issuesOnRoleEn).toHaveLength(1);
  });

  it('rejects an extra unknown root key in strict mode and lists the key', () => {
    const withExtra: Record<string, unknown> = { ...validHero, twitter: 'https://x.com/jcocano' };
    const result = heroSchema.safeParse(withExtra);
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

  it('rejects an extra unknown nested key inside links', () => {
    const withExtraLink = {
      ...validHero,
      links: { ...validHero.links, twitter: 'https://x.com/jcocano' },
    };
    const result = heroSchema.safeParse(withExtraLink);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const unrecognizedOnLinks = result.error.issues.filter(
      (issue): issue is typeof issue & { keys: string[] } =>
        issue.code === 'unrecognized_keys' &&
        issue.path[0] === 'links' &&
        Array.isArray((issue as { keys?: unknown }).keys),
    );
    expect(unrecognizedOnLinks).toHaveLength(1);
  });

  it('fails when links.email is not a valid email URL (mailto: or raw email)', () => {
    const broken = {
      ...validHero,
      links: { ...validHero.links, email: 'not-an-email' },
    };
    const result = heroSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnEmail = result.error.issues.filter(
      (issue) => issue.path[0] === 'links' && issue.path[1] === 'email',
    );
    expect(issuesOnEmail.length).toBeGreaterThan(0);
  });

  it('fails when links.github is not a valid URL', () => {
    const broken = {
      ...validHero,
      links: { ...validHero.links, github: 'jcocano' },
    };
    const result = heroSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnGithub = result.error.issues.filter(
      (issue) => issue.path[0] === 'links' && issue.path[1] === 'github',
    );
    expect(issuesOnGithub.length).toBeGreaterThan(0);
  });

  it('rejects an empty name string', () => {
    const empty = { ...validHero, name: '' };
    const result = heroSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnName = result.error.issues.filter((issue) => issue.path.includes('name'));
    expect(issuesOnName.length).toBeGreaterThan(0);
  });

  it('rejects an empty roleShort string', () => {
    const empty = { ...validHero, roleShort: '' };
    const result = heroSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnRoleShort = result.error.issues.filter((issue) =>
      issue.path.includes('roleShort'),
    );
    expect(issuesOnRoleShort.length).toBeGreaterThan(0);
  });

  it('parses the real src/data/hero.json singleton', () => {
    const parsed = heroSchema.parse(heroJson);
    expect(parsed.name.length).toBeGreaterThan(0);
    expect(parsed.links.email.startsWith('mailto:')).toBe(true);
    expect(parsed.links.github).toBe('https://github.com/jcocano');
    expect(parsed.links.linkedin).toBe('https://linkedin.com/in/jcocano');
    expect(parsed.roleShort).toBe('Backend / Platform / SRE');
  });
});
