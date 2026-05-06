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
    expect(html).toMatch(/data-type-meta/);
    expect(html).toMatch(/font-size/);
    expect(html).toMatch(/font-weight/);
  });

  it('renders specimens in fixed order: h1, h2, h3, h4, h5, h6, body, mono', async () => {
    const html = await renderTypeScale();
    const indices = [
      html.indexOf('id="type-h1"'),
      html.indexOf('id="type-h2"'),
      html.indexOf('id="type-h3"'),
      html.indexOf('id="type-h4"'),
      html.indexOf('id="type-h5"'),
      html.indexOf('id="type-h6"'),
      html.indexOf('id="type-body"'),
      html.indexOf('id="type-mono"'),
    ];
    for (let position = 1; position < indices.length; position += 1) {
      const previous = indices[position - 1];
      const current = indices[position];
      if (previous === undefined || current === undefined) {
        throw new Error('expected every specimen id to appear');
      }
      expect(current).toBeGreaterThan(previous);
    }
  });

  it('marks each row with data-type-spec so the css module can apply the .type-spec layout', async () => {
    const html = await renderTypeScale();
    const rows = html.match(/data-type-spec="/g);
    expect(rows).not.toBeNull();
    if (rows === null) {
      throw new Error('expected at least one data-type-spec row');
    }
    expect(rows).toHaveLength(8);
  });
});
