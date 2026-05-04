import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import MoreProjectsLink from '@/components/work/MoreProjectsLink.astro';

async function renderLink(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(MoreProjectsLink);
}

describe('MoreProjectsLink (render-test)', () => {
  it('renders an anchor pointing to /projects/', async () => {
    const html = await renderLink();
    expect(html).toMatch(/<a[^>]*href="[^"]*projects\/"/);
  });

  it('renders the bilingual label via t() with both <span lang="es"> and <span lang="en">', async () => {
    const html = await renderLink();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Más proyectos de interés →<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>More projects of interest →<\/span>/);
  });

  it('does NOT add a target attribute (this is an internal link)', async () => {
    const html = await renderLink();
    const anchorMatch = html.match(/<a[^>]*projects\/"[^>]*>/);
    expect(anchorMatch).not.toBeNull();
    if (anchorMatch === null) {
      throw new Error('expected an anchor');
    }
    expect(anchorMatch[0]).not.toContain('target=');
  });
});
