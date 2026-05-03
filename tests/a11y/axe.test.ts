import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { auditPageWithAxe } from './lib/audit-page-with-axe';
import { buildAxeTestCases } from './lib/build-axe-test-cases';

const distDir = resolve(__dirname, '..', '..', 'dist');

describe('axe-core a11y audit (Vitest)', () => {
  it('finds the dist/ build artifact (run `npm run build` first)', () => {
    expect(existsSync(distDir)).toBe(true);
  });

  it('actually evaluates rules — at least the canonical wcag-aa rules are exercised', async () => {
    const result = await auditPageWithAxe({
      distDir,
      pagePath: 'index.html',
      theme: 'dark',
      lang: 'es',
    });
    const passedRuleIds = result.passes.map((rule) => rule.id);
    // Structural rules JSDOM can evaluate. color-contrast is JSDOM-blind because
    // JSDOM's getComputedStyle does not resolve CSS custom properties to color
    // values; that check runs in the Playwright pass (tests/visual/axe-contrast.spec.ts).
    expect(passedRuleIds).toContain('document-title');
    expect(passedRuleIds).toContain('html-has-lang');
    expect(passedRuleIds).toContain('button-name');
    expect(passedRuleIds).toContain('link-name');
    expect(passedRuleIds).toContain('image-alt');
  });

  const cases = buildAxeTestCases();

  for (const testCase of cases) {
    const description =
      `${testCase.pagePath} · theme=${testCase.theme} · lang=${testCase.lang} ` +
      `has zero axe-core violations`;
    it(description, async () => {
      const result = await auditPageWithAxe({
        distDir,
        pagePath: testCase.pagePath,
        theme: testCase.theme,
        lang: testCase.lang,
      });
      const formatted = result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => node.html).slice(0, 3),
      }));
      expect(formatted).toEqual([]);
    });
  }
});
