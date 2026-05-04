import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import BackToHomeLink from '@/components/work/BackToHomeLink.astro';

async function renderLink(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(BackToHomeLink);
}

describe('BackToHomeLink (render-test)', () => {
  it('renders an anchor pointing to the home (BASE_URL root)', async () => {
    const html = await renderLink();
    // BASE_URL in tests is '/' by default; the href should resolve exactly to BASE_URL.
    expect(html).toMatch(/<a[^>]*href="\/"/);
  });

  it('renders bilingual labels via t("projects.backToHome")', async () => {
    const html = await renderLink();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>← Inicio<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>← Home<\/span>/);
  });

  it('does NOT open in a new tab (no target="_blank")', async () => {
    const html = await renderLink();
    expect(html).not.toMatch(/target="_blank"/);
  });
});
