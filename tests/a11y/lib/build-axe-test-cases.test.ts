import { describe, expect, it } from 'vitest';

import { buildAxeTestCases } from './build-axe-test-cases';

describe('buildAxeTestCases', () => {
  it('returns 36 cases (6 pages × 3 themes × 2 langs)', () => {
    const cases = buildAxeTestCases();
    expect(cases).toHaveLength(36);
  });

  it('covers exactly the 6 expected page paths', () => {
    const cases = buildAxeTestCases();
    const pagePaths = Array.from(new Set(cases.map((entry) => entry.pagePath))).sort();
    expect(pagePaths).toEqual([
      'design-system/index.html',
      'index.html',
      'projects/cluster-separation/index.html',
      'projects/incommers-nft/index.html',
      'projects/index.html',
      'projects/made-by-apes/index.html',
    ]);
  });

  it('covers exactly the 3 expected themes (dark, light, paper)', () => {
    const cases = buildAxeTestCases();
    const themes = Array.from(new Set(cases.map((entry) => entry.theme))).sort();
    expect(themes).toEqual(['dark', 'light', 'paper']);
  });

  it('covers exactly the 2 expected languages (en, es)', () => {
    const cases = buildAxeTestCases();
    const langs = Array.from(new Set(cases.map((entry) => entry.lang))).sort();
    expect(langs).toEqual(['en', 'es']);
  });

  it('emits exactly one entry per (page, theme, lang) combination', () => {
    const cases = buildAxeTestCases();
    const seen = new Set<string>();
    for (const entry of cases) {
      const key = `${entry.pagePath}|${entry.theme}|${entry.lang}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(36);
  });
});
