import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TheSystemPage from '@/pages/the-system/index.astro';
import principlesJson from '@/data/principles.json';
import { principlesSchema } from '@/lib/schemas/principles';

async function renderTheSystemPage(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TheSystemPage, {
    request: new Request('http://localhost/cv/the-system/'),
  });
}

describe('pages/the-system/index.astro (render-test)', () => {
  it('renders within BaseLayout (full <html> + <main id="main"> + nav)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<html[^>]*data-theme="dark"[^>]*data-lang="es"/);
    expect(html).toMatch(/<main[^>]*id="main"/);
  });

  it('renders an h1 with the bilingual page title (El sistema / The system)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<h1[^>]*>[\s\S]*El sistema[\s\S]*The system/);
  });

  it('sets the document <title> to "The system — Jesús Cocaño"', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<title>The system — Jesús Cocaño<\/title>/);
  });

  it(
    'renders the seven blocks in order: principles → decisions → tokens → ' +
      'typography → ui primitives → spacing → status',
    async () => {
      const html = await renderTheSystemPage();
      const principlesIndex = html.indexOf('id="block-principles"');
      const decisionsIndex = html.indexOf('id="block-decisions"');
      const tokensIndex = html.indexOf('id="block-tokens"');
      const typeIndex = html.indexOf('id="block-typography"');
      const uiIndex = html.indexOf('id="block-ui-primitives"');
      const spacingIndex = html.indexOf('id="block-spacing"');
      const statusIndex = html.indexOf('id="block-status"');

      expect(principlesIndex).toBeGreaterThan(-1);
      expect(decisionsIndex).toBeGreaterThan(principlesIndex);
      expect(tokensIndex).toBeGreaterThan(decisionsIndex);
      expect(typeIndex).toBeGreaterThan(tokensIndex);
      expect(uiIndex).toBeGreaterThan(typeIndex);
      expect(spacingIndex).toBeGreaterThan(uiIndex);
      expect(statusIndex).toBeGreaterThan(spacingIndex);
    },
  );

  it('mounts the PrinciplesList inside the principles block (one entry per JSON principle)', async () => {
    const html = await renderTheSystemPage();
    const parsed = principlesSchema.parse(principlesJson);
    const entries = html.match(/<article[^>]*data-principle-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected principle entries to render');
    }
    expect(entries).toHaveLength(parsed.principles.length);
    for (const principle of parsed.principles) {
      expect(html).toMatch(new RegExp(`id="${principle.id}"`));
    }
  });

  it('renders the bilingual principles eyebrow (principles / principios)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>principios<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>principles<\/span>/);
  });

  it('mounts the TokenSwatcher inside the tokens block (3 theme-blocks)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/data-theme-preview="dark"/);
    expect(html).toMatch(/data-theme-preview="light"/);
    expect(html).toMatch(/data-theme-preview="paper"/);
  });

  it('mounts the TypeScale (h1-h6 + body + mono ids)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="type-h1"/);
    expect(html).toMatch(/id="type-h6"/);
    expect(html).toMatch(/id="type-body"/);
    expect(html).toMatch(/id="type-mono"/);
  });

  it('mounts the UiGallery (Tag and at least 12 svgs from icons/)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="ui-tag"/);
    expect(html).toMatch(/id="ui-moon-icon"/);
    expect(html).toMatch(/id="ui-sun-icon"/);
  });

  it('mounts the SpacingScale (radius, radius-lg, container)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="spacing-radius-lg"/);
    expect(html).toMatch(/id="spacing-container"/);
  });

  it('mounts the DecisionsList (at least one decision-<id> entry)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="decision-token-set-extended"/);
    expect(html).toMatch(/id="decision-geist-fontsource"/);
  });

  it('mounts the SiteStatus block with the build-and-runtime heading and skeleton attributes', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="block-status"/);
    // Iteration-2 architecture: the SSR skeleton wraps the <dl> in a
    // <div role="status" aria-busy="true" data-component="site-status">. The
    // values arrive at runtime from the client module, so we only assert
    // structural hooks here.
    expect(html).toMatch(/<div[^>]*data-component="site-status"/);
    expect(html).toMatch(/<div[^>]*aria-busy="true"/);
    expect(html).toMatch(/<div[^>]*role="status"/);
  });
});
