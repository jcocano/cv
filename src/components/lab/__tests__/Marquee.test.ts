import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Marquee from '@/components/lab/Marquee.astro';

const MARQUEE_WORDS = ['build', 'break', 'observe', 'iterate', 'ship'] as const;

async function renderMarquee(words: readonly string[]): Promise<string> {
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

  it('renders the five words repeated three times (15 word spans total)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    for (const word of MARQUEE_WORDS) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders the · separator span between words, repeated 15 times (5 per copy x 3 copies)', async () => {
    const html = await renderMarquee(MARQUEE_WORDS);
    const matches = html.match(/<span[^>]*>·<\/span>/g);
    expect(matches).not.toBeNull();
    if (matches === null) {
      throw new Error('expected 15 separator spans');
    }
    expect(matches).toHaveLength(15);
  });

  it('renders any provided word list (no hardcoded words)', async () => {
    const customWords = ['alpha', 'beta'];
    const html = await renderMarquee(customWords);
    const alphaMatches = html.match(/<span[^>]*>alpha<\/span>/g);
    const betaMatches = html.match(/<span[^>]*>beta<\/span>/g);
    expect(alphaMatches).not.toBeNull();
    expect(betaMatches).not.toBeNull();
    if (alphaMatches === null || betaMatches === null) {
      throw new Error('expected custom words rendered three times each');
    }
    expect(alphaMatches).toHaveLength(3);
    expect(betaMatches).toHaveLength(3);
    expect(html).not.toMatch(/<span[^>]*>build<\/span>/);
  });
});
