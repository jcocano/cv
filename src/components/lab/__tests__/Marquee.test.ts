import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Marquee from '@/components/lab/Marquee.astro';

const MARQUEE_WORDS = {
  es: ['construir', 'romper', 'observar', 'iterar', 'lanzar'],
  en: ['build', 'break', 'observe', 'iterate', 'ship'],
} as const;

interface BilingualWords {
  readonly es: readonly string[];
  readonly en: readonly string[];
}

async function renderMarquee(words: BilingualWords): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Marquee, { props: { words } });
}

describe('Marquee (render-test)', () => {
  it('renders the stage container with id="stage-marquee" so the script can locate it', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    expect(html).toMatch(/id="stage-marquee"/);
  });

  it('renders the inner track with id="marquee-track" inside the stage', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    expect(html).toMatch(/id="marquee-track"/);
    expect(html).toMatch(/<div[^>]*id="stage-marquee"[^>]*>[\s\S]*<div[^>]*id="marquee-track"/);
  });

  it('renders the track with the initial neutral state: data-dir="1"', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    expect(html).toMatch(/<div[^>]*id="marquee-track"[^>]*data-dir="1"/);
  });

  it('renders the track with the initial neutral CSS variable --speed: 40s', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    expect(html).toMatch(/<div[^>]*id="marquee-track"[^>]*style="[^"]*--speed:\s*40s/);
  });

  it('renders three es wrappers and three en wrappers (one pair per copy, three copies)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    const esWraps = html.match(/<span[^>]*lang="es"[^>]*>/g);
    const enWraps = html.match(/<span[^>]*lang="en"[^>]*>/g);
    expect(esWraps).not.toBeNull();
    expect(enWraps).not.toBeNull();
    if (esWraps === null || enWraps === null) {
      throw new Error('expected three es wrappers and three en wrappers');
    }
    expect(esWraps).toHaveLength(3);
    expect(enWraps).toHaveLength(3);
  });

  it('renders each Spanish word three times (once per copy)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    for (const word of MARQUEE_WORDS.es) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for Spanish word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders each English word three times (once per copy)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    for (const word of MARQUEE_WORDS.en) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for English word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders the · separator span 30 times (5 per wrapper x 2 wrappers per copy x 3 copies)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    const matches = html.match(/<span[^>]*>·<\/span>/g);
    expect(matches).not.toBeNull();
    if (matches === null) {
      throw new Error('expected 30 separator spans');
    }
    expect(matches).toHaveLength(30);
  });

  it('renders any provided word lists (no hardcoded words)', async () => {
    const customWords = {
      es: ['alfa', 'beta'],
      en: ['alpha', 'beta'],
    };
    const html = await renderMarquee(customWords);
    const alfaMatches = html.match(/<span[^>]*>alfa<\/span>/g);
    const alphaMatches = html.match(/<span[^>]*>alpha<\/span>/g);
    expect(alfaMatches).not.toBeNull();
    expect(alphaMatches).not.toBeNull();
    if (alfaMatches === null || alphaMatches === null) {
      throw new Error('expected custom words rendered three times each');
    }
    expect(alfaMatches).toHaveLength(3);
    expect(alphaMatches).toHaveLength(3);
    expect(html).not.toMatch(/<span[^>]*>build<\/span>/);
    expect(html).not.toMatch(/<span[^>]*>construir<\/span>/);
  });
});
