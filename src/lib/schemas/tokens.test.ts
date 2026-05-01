import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { themeTokensSchema, tokensSchema } from '@/lib/schemas/tokens';

function omitKey<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keyToOmit: K,
): Omit<T, K> {
  const entries = Object.entries(source).filter(([key]) => key !== keyToOmit);
  return Object.fromEntries(entries) as Omit<T, K>;
}

const darkTokens = {
  bg: '#0a0a0b',
  'bg-elev': '#111113',
  'bg-elev-2': '#18181b',
  fg: '#fafafa',
  'fg-dim': '#a1a1aa',
  'fg-mute': '#52525b',
  line: '#27272a',
  'line-soft': '#1c1c1f',
  accent: 'oklch(0.82 0.16 145)',
  'accent-dim': 'oklch(0.82 0.16 145 / 0.12)',
  warn: 'oklch(0.78 0.15 60)',
} as const;

const lightTokens = {
  bg: '#fafaf8',
  'bg-elev': '#f3f3f0',
  'bg-elev-2': '#ebebe7',
  fg: '#0a0a0b',
  'fg-dim': '#52525b',
  'fg-mute': '#a1a1aa',
  line: '#d4d4d4',
  'line-soft': '#e7e7e4',
  accent: 'oklch(0.55 0.16 145)',
  'accent-dim': 'oklch(0.55 0.16 145 / 0.1)',
  warn: 'oklch(0.78 0.15 60)',
} as const;

const paperTokens = {
  bg: '#f5f1e8',
  'bg-elev': '#ede7d6',
  'bg-elev-2': '#e3dcc6',
  fg: '#1a1612',
  'fg-dim': '#5c5447',
  'fg-mute': '#8a8170',
  line: '#c8bfa5',
  'line-soft': '#d8d0b8',
  accent: 'oklch(0.55 0.18 50)',
  'accent-dim': 'oklch(0.55 0.18 50 / 0.12)',
  warn: 'oklch(0.78 0.15 60)',
} as const;

describe('themeTokensSchema', () => {
  it('parses a valid dark theme with all 11 tokens', () => {
    const parsed = themeTokensSchema.parse(darkTokens);
    expect(parsed.bg).toBe('#0a0a0b');
    expect(parsed['bg-elev']).toBe('#111113');
    expect(parsed['bg-elev-2']).toBe('#18181b');
    expect(parsed.fg).toBe('#fafafa');
    expect(parsed['fg-dim']).toBe('#a1a1aa');
    expect(parsed['fg-mute']).toBe('#52525b');
    expect(parsed.line).toBe('#27272a');
    expect(parsed['line-soft']).toBe('#1c1c1f');
    expect(parsed.accent).toBe('oklch(0.82 0.16 145)');
    expect(parsed['accent-dim']).toBe('oklch(0.82 0.16 145 / 0.12)');
    expect(parsed.warn).toBe('oklch(0.78 0.15 60)');
  });

  it('parses a valid paper theme', () => {
    const parsed = themeTokensSchema.parse(paperTokens);
    expect(parsed.bg).toBe('#f5f1e8');
    expect(parsed.accent).toBe('oklch(0.55 0.18 50)');
    expect(parsed.warn).toBe('oklch(0.78 0.15 60)');
  });

  it('fails with a Zod error pointing at "warn" when warn is missing', () => {
    const lightWithoutWarn = omitKey(lightTokens, 'warn');
    const result = themeTokensSchema.safeParse(lightWithoutWarn);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnWarn = result.error.issues.filter((issue) => issue.path.includes('warn'));
    expect(issuesOnWarn).toHaveLength(1);
  });

  it('rejects an extra unknown key in strict mode', () => {
    const withExtra = { ...darkTokens, 'unknown-token': '#000000' };
    expect(() => themeTokensSchema.parse(withExtra)).toThrow(ZodError);
  });

  it('rejects a non-string token value', () => {
    const withNumberBg: Record<string, unknown> = { ...darkTokens, bg: 123 };
    const result = themeTokensSchema.safeParse(withNumberBg);
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const issuesOnBg = result.error.issues.filter((issue) => issue.path.includes('bg'));
    expect(issuesOnBg).toHaveLength(1);
  });
});

describe('tokensSchema', () => {
  it('parses an object with the three themes (dark, light, paper)', () => {
    const parsed = tokensSchema.parse({
      dark: darkTokens,
      light: lightTokens,
      paper: paperTokens,
    });
    expect(parsed.dark.bg).toBe('#0a0a0b');
    expect(parsed.light.bg).toBe('#fafaf8');
    expect(parsed.paper.bg).toBe('#f5f1e8');
  });

  it('fails when light theme is missing the warn token', () => {
    const lightWithoutWarn = omitKey(lightTokens, 'warn');
    const result = tokensSchema.safeParse({
      dark: darkTokens,
      light: lightWithoutWarn,
      paper: paperTokens,
    });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('expected parse to fail');
    }
    const lightWarnIssues = result.error.issues.filter(
      (issue) => issue.path[0] === 'light' && issue.path[1] === 'warn',
    );
    expect(lightWarnIssues).toHaveLength(1);
  });

  it('fails when an unknown theme is provided in strict mode', () => {
    expect(() =>
      tokensSchema.parse({
        dark: darkTokens,
        light: lightTokens,
        paper: paperTokens,
        sepia: darkTokens,
      }),
    ).toThrow(ZodError);
  });
});
