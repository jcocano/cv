import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type ThemeName = 'dark' | 'light' | 'paper';
type LangCode = 'es' | 'en';

interface ContrastCase {
  readonly path: string;
  readonly slug: string;
  readonly theme: ThemeName;
  readonly lang: LangCode;
}

const PAGES: ReadonlyArray<{ path: string; slug: string }> = [
  { path: '', slug: 'home' },
  { path: 'projects/', slug: 'projects' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'the-system/', slug: 'the-system' },
];
const THEMES: readonly ThemeName[] = ['dark', 'light', 'paper'];
const LANGS: readonly LangCode[] = ['es', 'en'];

function buildContrastCases(): readonly ContrastCase[] {
  const cases: ContrastCase[] = [];
  for (const page of PAGES) {
    for (const theme of THEMES) {
      for (const lang of LANGS) {
        cases.push({ path: page.path, slug: page.slug, theme, lang });
      }
    }
  }
  return cases;
}

test.describe('axe-core color-contrast (Chromium)', () => {
  for (const contrastCase of buildContrastCases()) {
    test(
      `${contrastCase.slug} · ${contrastCase.theme} · ${contrastCase.lang} ` +
        `passes wcag2aa color-contrast`,
      async ({ page }) => {
        await page.addInitScript(
          ({ theme, lang }) => {
            window.localStorage.setItem('theme', theme);
            window.localStorage.setItem('lang', lang);
          },
          { theme: contrastCase.theme, lang: contrastCase.lang },
        );
        await page.goto(contrastCase.path, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        const result = await new AxeBuilder({ page })
          .withTags(['wcag2aa', 'wcag21aa'])
          .options({ runOnly: ['color-contrast'] })
          .analyze();

        const formatted = result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => ({
            html: node.html,
            target: node.target,
            failureSummary: node.failureSummary,
          })),
        }));
        expect(formatted).toEqual([]);
      },
    );
  }
});
