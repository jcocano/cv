import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import DesignSystemPage from '@/pages/design-system/index.astro';

async function renderDesignSystemPage(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(DesignSystemPage, {
    request: new Request('http://localhost/cv/design-system/'),
  });
}

describe('pages/design-system/index.astro (render-test)', () => {
  it('renders within BaseLayout (full <html> + <main id="main"> + nav)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/<html[^>]*data-theme="dark"[^>]*data-lang="es"/);
    expect(html).toMatch(/<main[^>]*id="main"/);
  });

  it('renders an h1 with the design-system page title', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Design system/);
  });

  it('renders the five blocks in order: tokens → typography → ui primitives → spacing → decisions', async () => {
    const html = await renderDesignSystemPage();
    const tokensIndex = html.indexOf('id="block-tokens"');
    const typeIndex = html.indexOf('id="block-typography"');
    const uiIndex = html.indexOf('id="block-ui-primitives"');
    const spacingIndex = html.indexOf('id="block-spacing"');
    const decisionsIndex = html.indexOf('id="block-decisions"');

    expect(tokensIndex).toBeGreaterThan(-1);
    expect(typeIndex).toBeGreaterThan(tokensIndex);
    expect(uiIndex).toBeGreaterThan(typeIndex);
    expect(spacingIndex).toBeGreaterThan(uiIndex);
    expect(decisionsIndex).toBeGreaterThan(spacingIndex);
  });

  it('mounts the TokenSwatcher inside the tokens block (3 theme-blocks)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/data-theme-preview="dark"/);
    expect(html).toMatch(/data-theme-preview="light"/);
    expect(html).toMatch(/data-theme-preview="paper"/);
  });

  it('mounts the TypeScale (h1-h6 + body + mono ids)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/id="type-h1"/);
    expect(html).toMatch(/id="type-h6"/);
    expect(html).toMatch(/id="type-body"/);
    expect(html).toMatch(/id="type-mono"/);
  });

  it('mounts the UiGallery (Tag and at least 12 svgs from icons/)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/id="ui-tag"/);
    expect(html).toMatch(/id="ui-moon-icon"/);
    expect(html).toMatch(/id="ui-sun-icon"/);
  });

  it('mounts the SpacingScale (radius, radius-lg, container)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="spacing-radius-lg"/);
    expect(html).toMatch(/id="spacing-container"/);
  });

  it('mounts the DecisionsList (at least one decision-<id> entry)', async () => {
    const html = await renderDesignSystemPage();
    expect(html).toMatch(/id="decision-token-set-extended"/);
    expect(html).toMatch(/id="decision-geist-fontsource"/);
  });
});
