import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CANONICAL_TOKEN_NAMES,
  TOKEN_VALUES_BY_THEME,
  type ColorTokenName,
  type ThemeName,
} from './token-values';

const TOKENS_CSS_PATH = fileURLToPath(new URL('../../styles/tokens.css', import.meta.url));
const TOKENS_CSS = readFileSync(TOKENS_CSS_PATH, 'utf8');

const ROOT_BLOCK_PATTERN = /:root\s*\{([\s\S]*?)\}/;
const LIGHT_BLOCK_PATTERN = /:root\[data-theme=['"]light['"]\]\s*\{([\s\S]*?)\}/;
const PAPER_BLOCK_PATTERN = /:root\[data-theme=['"]paper['"]\]\s*\{([\s\S]*?)\}/;

function extractDeclaration(block: string, token: ColorTokenName): string {
  const pattern = new RegExp(`--${token}\\s*:\\s*([^;]+);`);
  const match = block.match(pattern);
  if (match === null || match[1] === undefined) {
    throw new Error(`token --${token} not declared in given CSS block`);
  }
  return match[1].trim();
}

function blockFor(theme: ThemeName): string {
  if (theme === 'dark') {
    const match = TOKENS_CSS.match(ROOT_BLOCK_PATTERN);
    if (match === null || match[1] === undefined) {
      throw new Error('expected :root block in tokens.css for dark theme');
    }
    return match[1];
  }
  if (theme === 'light') {
    const match = TOKENS_CSS.match(LIGHT_BLOCK_PATTERN);
    if (match === null || match[1] === undefined) {
      throw new Error('expected :root[data-theme="light"] block in tokens.css');
    }
    return match[1];
  }
  const match = TOKENS_CSS.match(PAPER_BLOCK_PATTERN);
  if (match === null || match[1] === undefined) {
    throw new Error('expected :root[data-theme="paper"] block in tokens.css');
  }
  return match[1];
}

describe('CANONICAL_TOKEN_NAMES', () => {
  it('lists exactly the 11 canonical color tokens in the documented order', () => {
    expect(CANONICAL_TOKEN_NAMES).toEqual([
      'bg',
      'bg-elev',
      'bg-elev-2',
      'fg',
      'fg-dim',
      'fg-mute',
      'line',
      'line-soft',
      'accent',
      'accent-dim',
      'warn',
    ]);
  });

  it('keeps the list immutable (readonly tuple, no duplicates)', () => {
    const seen = new Set<string>(CANONICAL_TOKEN_NAMES);
    expect(seen.size).toBe(CANONICAL_TOKEN_NAMES.length);
  });
});

describe('TOKEN_VALUES_BY_THEME — parity with src/styles/tokens.css', () => {
  for (const theme of ['dark', 'light', 'paper'] as const) {
    it(`declares every canonical token for the ${theme} theme`, () => {
      const themeMap = TOKEN_VALUES_BY_THEME[theme];
      for (const token of CANONICAL_TOKEN_NAMES) {
        expect(themeMap[token]).toBeDefined();
        expect(themeMap[token].length).toBeGreaterThan(0);
      }
    });

    it(`matches every token value declared in tokens.css for the ${theme} theme`, () => {
      const block = blockFor(theme);
      const themeMap = TOKEN_VALUES_BY_THEME[theme];
      for (const token of CANONICAL_TOKEN_NAMES) {
        const cssValue = extractDeclaration(block, token);
        expect(themeMap[token]).toBe(cssValue);
      }
    });
  }

  it('has no extra theme keys beyond dark / light / paper', () => {
    expect(Object.keys(TOKEN_VALUES_BY_THEME).sort()).toEqual(['dark', 'light', 'paper']);
  });
});
