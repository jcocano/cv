import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import LabSystemLink from '@/components/lab/LabSystemLink.astro';

async function renderLabSystemLink(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LabSystemLink);
}

describe('LabSystemLink (render-test)', () => {
  it('renders an anchor pointing to the-system page using BASE_URL', async () => {
    const html = await renderLabSystemLink();
    expect(html).toMatch(/<a[^>]*href="[^"]*the-system\/"/);
  });

  it('renders the bilingual copy from i18n keys (lab.systemLink in both languages)', async () => {
    const html = await renderLabSystemLink();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>El sistema detrás de estas piezas →<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>The system behind these pieces →<\/span>/);
  });
});
