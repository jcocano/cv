export type ThemeName = 'dark' | 'light' | 'paper';
export type LangCode = 'es' | 'en';

export interface AxeTestCase {
  readonly pagePath: string;
  readonly theme: ThemeName;
  readonly lang: LangCode;
}

const PAGE_PATHS: readonly string[] = [
  'index.html',
  'projects/index.html',
  'projects/7a4b3c05-879d-4148-87c9-17f1fd81367f/index.html',
  'the-system/index.html',
];

const THEMES: readonly ThemeName[] = ['dark', 'light', 'paper'];
const LANGS: readonly LangCode[] = ['es', 'en'];

export function buildAxeTestCases(): readonly AxeTestCase[] {
  const cases: AxeTestCase[] = [];
  for (const pagePath of PAGE_PATHS) {
    for (const theme of THEMES) {
      for (const lang of LANGS) {
        cases.push({ pagePath, theme, lang });
      }
    }
  }
  return cases;
}
