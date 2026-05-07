import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import KineticType from '@/components/lab/KineticType.astro';

const KINETIC_WORDS = {
  es: ['distribuido', 'resiliente', 'observable', 'elástico', 'event-driven', 'cloud-native'],
  en: ['distributed', 'resilient', 'observable', 'elastic', 'event-driven', 'cloud-native'],
} as const;

interface BilingualWords {
  readonly es: readonly string[];
  readonly en: readonly string[];
}

async function renderKineticType(words: BilingualWords): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(KineticType, { props: { words } });
}

describe('KineticType (render-test)', () => {
  it('renders the stage container with id="stage-kinetic" so the script can locate it', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    expect(html).toMatch(/id="stage-kinetic"/);
  });

  it('renders one wrap with lang="es" and one wrap with lang="en" inside the stage', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    const esWrap = html.match(/<div[^>]*lang="es"[^>]*>/g);
    const enWrap = html.match(/<div[^>]*lang="en"[^>]*>/g);
    expect(esWrap).not.toBeNull();
    expect(enWrap).not.toBeNull();
    if (esWrap === null || enWrap === null) {
      throw new Error('expected one es wrap and one en wrap');
    }
    expect(esWrap).toHaveLength(1);
    expect(enWrap).toHaveLength(1);
  });

  it('renders each Spanish word verbatim somewhere in the rendered html', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    for (const word of KINETIC_WORDS.es) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders each English word verbatim somewhere in the rendered html', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    for (const word of KINETIC_WORDS.en) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders twelve word spans total (6 es + 6 en) inside the stage', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    const stageStart = html.indexOf('id="stage-kinetic"');
    expect(stageStart).toBeGreaterThan(-1);
    const stageInner = html.slice(stageStart);
    const wordSpans = stageInner.match(/<span[^>]*>[^<]+<\/span>/g);
    expect(wordSpans).not.toBeNull();
    if (wordSpans === null) {
      throw new Error('expected word spans inside the stage');
    }
    expect(wordSpans.length).toBeGreaterThanOrEqual(12);
    const expectedWords: readonly string[] = [...KINETIC_WORDS.es, ...KINETIC_WORDS.en];
    const wordContents = wordSpans
      .map((span) => span.replace(/<span[^>]*>/, '').replace(/<\/span>/, ''))
      .filter((text) => expectedWords.includes(text));
    expect(wordContents).toHaveLength(12);
  });

  it('renders any provided word lists (no hardcoded list)', async () => {
    const customWords = {
      es: ['alfa', 'beta', 'gamma'],
      en: ['alpha', 'beta', 'gamma'],
    };
    const html = await renderKineticType(customWords);
    expect(html).toMatch(/<span[^>]*>alfa<\/span>/);
    expect(html).toMatch(/<span[^>]*>alpha<\/span>/);
    expect(html).not.toMatch(/<span[^>]*>distributed<\/span>/);
    expect(html).not.toMatch(/<span[^>]*>distribuido<\/span>/);
  });
});
