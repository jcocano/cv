import { expect, test } from '@playwright/test';

type ThemeName = 'dark' | 'light' | 'paper';
type LangCode = 'es' | 'en';

interface VisualCase {
  readonly path: string;
  readonly slug: string;
  readonly theme: ThemeName;
  readonly lang: LangCode;
}

const PAGES: ReadonlyArray<{ path: string; slug: string }> = [
  { path: '', slug: 'home' },
  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },
  { path: 'projects/incommers-nft/', slug: 'project-incommers-nft' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'design-system/', slug: 'design-system' },
];
const THEMES: readonly ThemeName[] = ['dark', 'light', 'paper'];
const LANGS: readonly LangCode[] = ['es', 'en'];

function buildVisualCases(): readonly VisualCase[] {
  const cases: VisualCase[] = [];
  for (const page of PAGES) {
    for (const theme of THEMES) {
      for (const lang of LANGS) {
        cases.push({ path: page.path, slug: page.slug, theme, lang });
      }
    }
  }
  return cases;
}

test.describe('visual baselines (1440×900, full-page)', () => {
  for (const visualCase of buildVisualCases()) {
    test(`${visualCase.slug} · ${visualCase.theme} · ${visualCase.lang}`, async ({ page }) => {
      await page.addInitScript(
        ({ theme, lang }) => {
          window.localStorage.setItem('theme', theme);
          window.localStorage.setItem('lang', lang);
        },
        { theme: visualCase.theme, lang: visualCase.lang },
      );
      await page.goto(visualCase.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const screenshotName = `${visualCase.slug}__${visualCase.theme}__${visualCase.lang}.png`;
      await expect(page).toHaveScreenshot(screenshotName, { fullPage: true });
    });
  }
});
