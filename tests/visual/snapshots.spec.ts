import { expect, test } from '@playwright/test';

import statusFixture from '../../src/fixtures/status-fixture.json' with { type: 'json' };

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
  { path: 'projects/', slug: 'projects' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'projects/incommers-nft/', slug: 'project-incommers-nft' },
  { path: 'the-system/', slug: 'the-system' },
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

          let seed = 0x9e3779b9;
          Math.random = (): number => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        },
        { theme: visualCase.theme, lang: visualCase.lang },
      );

      // The /the-system/ page hosts the SiteStatus client module which
      // fetches /cv/status.json at runtime. To make the visual snapshot
      // deterministic we intercept that request and serve the same fixture
      // used by the unit tests. This way the baseline captures the LOADED
      // state with stable values, not the SSR skeleton or build-dependent
      // numbers. See feature #40 (iteration 2) and
      // docs/learnings_dependencia_circular_site_status.md.
      if (visualCase.slug === 'the-system') {
        await page.route('**/cv/status.json', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(statusFixture),
          });
        });
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(visualCase.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      if (visualCase.slug === 'the-system') {
        await page.waitForSelector(
          'div[data-component="site-status"][aria-busy="false"][data-status-state="loaded"]',
          { state: 'attached' },
        );
      }

      await page.evaluate(() => {
        const elements = document.querySelectorAll<HTMLElement>('.reveal');
        elements.forEach((element) => {
          element.classList.add('in');
        });
      });
      await page.waitForTimeout(800);

      const screenshotName = `${visualCase.slug}__${visualCase.theme}__${visualCase.lang}.png`;
      await expect(page).toHaveScreenshot(screenshotName, { fullPage: true });
    });
  }
});
