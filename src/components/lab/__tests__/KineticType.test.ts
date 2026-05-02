import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import KineticType from '@/components/lab/KineticType.astro';

const KINETIC_WORDS = [
  'distributed',
  'resilient',
  'observable',
  'elastic',
  'event-driven',
  'cloud-native',
] as const;

async function renderKineticType(words: readonly string[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(KineticType, { props: { words } });
}

describe('KineticType (render-test)', () => {
  it('renders the stage container with id="stage-kinetic" so the script can locate it', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    expect(html).toMatch(/id="stage-kinetic"/);
  });

  it('renders exactly six word spans, one per provided word', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    const matches = html.match(
      /<span[^>]*>(?:distributed|resilient|observable|elastic|event-driven|cloud-native)<\/span>/g,
    );
    expect(matches).not.toBeNull();
    if (matches === null) {
      throw new Error('expected six word spans');
    }
    expect(matches).toHaveLength(6);
  });

  it('renders each provided word verbatim inside its span', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    for (const word of KINETIC_WORDS) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders the inner wrap inside the stage container', async () => {
    const html = await renderKineticType(KINETIC_WORDS);
    expect(html).toMatch(/<div[^>]*id="stage-kinetic"[^>]*>\s*<div[^>]*class="[^"]+"/);
  });

  it('renders the requested words even when a different list is provided (no hardcoded list)', async () => {
    const customWords = ['alpha', 'beta', 'gamma'];
    const html = await renderKineticType(customWords);
    expect(html).toMatch(/<span[^>]*>alpha<\/span>/);
    expect(html).toMatch(/<span[^>]*>beta<\/span>/);
    expect(html).toMatch(/<span[^>]*>gamma<\/span>/);
    expect(html).not.toMatch(/<span[^>]*>distributed<\/span>/);
  });
});
