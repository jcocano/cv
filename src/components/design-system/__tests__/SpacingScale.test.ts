import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SpacingScale from '@/components/design-system/SpacingScale.astro';

async function renderSpacingScale(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SpacingScale);
}

describe('SpacingScale (render-test)', () => {
  it('renders an entry per spacing/radius token (radius, radius-lg, container) with id spacing-<token>', async () => {
    const html = await renderSpacingScale();
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="spacing-radius-lg"/);
    expect(html).toMatch(/id="spacing-container"/);
  });

  it('renders the resolved value next to each token (8px, 14px, 1180px)', async () => {
    const html = await renderSpacingScale();
    expect(html).toContain('8px');
    expect(html).toContain('14px');
    expect(html).toContain('1180px');
  });

  it('renders each token name as an h4 (one level below the spacing h3 sub-block under foundations)', async () => {
    const html = await renderSpacingScale();
    expect(html).toMatch(/<h4[^>]*id="spacing-radius"/);
    expect(html).toMatch(/<h4[^>]*id="spacing-radius-lg"/);
    expect(html).toMatch(/<h4[^>]*id="spacing-container"/);
    // No leftover h3 with the same ids.
    expect(html).not.toMatch(/<h3[^>]*id="spacing-(radius|radius-lg|container)"/);
  });

  it('marks each cell with data-spec-cell so the css module can apply the .spec-grid layout', async () => {
    const html = await renderSpacingScale();
    const cells = html.match(/data-spec-cell="/g);
    expect(cells).not.toBeNull();
    if (cells === null) {
      throw new Error('expected at least one data-spec-cell');
    }
    expect(cells).toHaveLength(3);
  });

  it('renders the three cells in fixed order: --radius, --radius-lg, --container', async () => {
    const html = await renderSpacingScale();
    const radiusIndex = html.indexOf('id="spacing-radius"');
    const radiusLgIndex = html.indexOf('id="spacing-radius-lg"');
    const containerIndex = html.indexOf('id="spacing-container"');
    expect(radiusIndex).toBeGreaterThan(-1);
    expect(radiusLgIndex).toBeGreaterThan(radiusIndex);
    expect(containerIndex).toBeGreaterThan(radiusLgIndex);
  });
});
