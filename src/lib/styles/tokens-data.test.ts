import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { tokensSchema, type ThemeTokens } from '@/lib/schemas/tokens';
import { tokensData } from '@/lib/styles/tokens-data';

const cssPath = fileURLToPath(new URL('../../styles/tokens.css', import.meta.url));

const themeSelectors: Record<keyof typeof tokensData, RegExp> = {
  dark: /:root\s*\{([^}]*)\}/,
  light: /:root\[data-theme=["']light["']\]\s*\{([^}]*)\}/,
  paper: /:root\[data-theme=["']paper["']\]\s*\{([^}]*)\}/,
};

function extractTokenMap(cssBlock: string): Record<string, string> {
  const declarations = cssBlock.split(';');
  const tokens: Record<string, string> = {};
  for (const declaration of declarations) {
    const trimmed = declaration.trim();
    if (!trimmed.startsWith('--')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.slice(2, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    tokens[key] = value;
  }
  return tokens;
}

describe('tokens-data and tokens.css alignment', () => {
  it('tokensData parses successfully against tokensSchema', () => {
    const parsed = tokensSchema.parse(tokensData);
    expect(parsed.dark.bg).toBe('#0a0a0b');
    expect(parsed.light.bg).toBe('#fafaf8');
    expect(parsed.paper.bg).toBe('#f5f1e8');
  });

  it.each(['dark', 'light', 'paper'] as const)(
    'tokens.css block for theme %s declares the same 11 tokens as tokensData',
    (themeName) => {
      const css = readFileSync(cssPath, 'utf8');
      const blockMatch = themeSelectors[themeName].exec(css);
      expect(blockMatch).not.toBeNull();
      const block = blockMatch?.[1] ?? '';
      const cssTokens = extractTokenMap(block);
      const themeTokens: ThemeTokens = tokensData[themeName];
      const expectedKeys = Object.keys(themeTokens).sort();
      const declaredKeys = Object.keys(cssTokens)
        .filter((key) => expectedKeys.includes(key))
        .sort();
      expect(declaredKeys).toEqual(expectedKeys);
      for (const key of expectedKeys) {
        expect(cssTokens[key]).toBe(themeTokens[key as keyof ThemeTokens]);
      }
    },
  );

  // iter 9 (feature #17): the project ASCII diagrams use unicode box-drawing
  // chars (│, ▼, ──→). Geist Mono did not guarantee 1ch width for these,
  // breaking the visual alignment, so we standardised on JetBrains Mono Variable
  // as the only mono face. These two regressions guard against accidentally
  // bringing Geist Mono back via --font-mono.
  it('--font-mono uses JetBrains Mono Variable as primary face (iter 9)', () => {
    const css = readFileSync(cssPath, 'utf8');
    const monoMatch = /--font-mono\s*:\s*([^;]+);/.exec(css);
    expect(monoMatch).not.toBeNull();
    const value = monoMatch?.[1]?.trim() ?? '';
    expect(value.startsWith("'JetBrains Mono Variable'")).toBe(true);
  });

  it('--font-mono no longer mentions Geist Mono (iter 9)', () => {
    const css = readFileSync(cssPath, 'utf8');
    const monoMatch = /--font-mono\s*:\s*([^;]+);/.exec(css);
    expect(monoMatch).not.toBeNull();
    const value = monoMatch?.[1] ?? '';
    expect(value).not.toMatch(/Geist Mono/);
  });
});
