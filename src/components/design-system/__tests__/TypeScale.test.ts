import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TypeScale from '@/components/design-system/TypeScale.astro';

async function renderTypeScale(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TypeScale);
}

describe('TypeScale (render-test)', () => {
  it('renders one specimen for each level h1, h2, h3, h4, h5, h6', async () => {
    const html = await renderTypeScale();
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      expect(html).toMatch(new RegExp(`<${level}[^>]*id="type-${level}"`));
    }
  });

  it('renders a body specimen with id="type-body"', async () => {
    const html = await renderTypeScale();
    expect(html).toMatch(/<p[^>]*id="type-body"/);
  });

  it('renders a mono specimen with id="type-mono"', async () => {
    const html = await renderTypeScale();
    expect(html).toMatch(/<code[^>]*id="type-mono"/);
  });

  it('renders the size and weight metadata next to each specimen in mono', async () => {
    const html = await renderTypeScale();
    expect(html).toMatch(/<dl[^>]*data-type-meta/);
    expect(html).toMatch(/font-size/);
    expect(html).toMatch(/font-weight/);
  });
});
