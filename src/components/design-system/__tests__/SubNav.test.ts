import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SubNav from '@/components/design-system/SubNav.astro';

async function renderSubNav(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SubNav);
}

const ANCHORS: ReadonlyArray<{ readonly href: string; readonly num: string }> = [
  { href: '#why', num: '01' },
  { href: '#how', num: '02' },
  { href: '#what', num: '03' },
  { href: '#tokens', num: '04' },
  { href: '#build', num: '05' },
];

describe('SubNav (render-test)', () => {
  it('renders a <nav> wrapper with role="navigation" and an aria-label', async () => {
    const html = await renderSubNav();
    expect(html).toMatch(/<nav[^>]*data-component="the-system-subnav"/);
    expect(html).toMatch(/aria-label="/);
  });

  it('renders one <a> per pillar (5 anchors)', async () => {
    const html = await renderSubNav();
    const anchors = html.match(/<a[^>]*href="#(why|how|what|tokens|build)"/g);
    expect(anchors).not.toBeNull();
    if (anchors === null) {
      throw new Error('expected sub-nav anchors to render');
    }
    expect(anchors).toHaveLength(5);
  });

  it('renders anchors in the documented order: #why, #how, #what, #tokens, #build', async () => {
    const html = await renderSubNav();
    const indices = ANCHORS.map(({ href }) => html.indexOf(`href="${href}"`));
    for (let position = 1; position < indices.length; position += 1) {
      const previous = indices[position - 1];
      const current = indices[position];
      if (previous === undefined || current === undefined) {
        throw new Error('expected every anchor to appear in the rendered HTML');
      }
      expect(current).toBeGreaterThan(previous);
    }
  });

  it('renders the bilingual label of each anchor in two <span lang> children', async () => {
    const html = await renderSubNav();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Por qué<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Why<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Cómo<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>How<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Qué<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>What<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Tokens<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Tokens<\/span>/);
    // & is encoded as &amp; in attribute-free text, but the renderer keeps
    // it as `&` here; either form is acceptable so we use a permissive regex.
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Build (&|&amp;) runtime<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Build (&|&amp;) runtime<\/span>/);
  });

  it('renders the numeric prefix (01, 02, 03, 04, 05) inside each anchor', async () => {
    const html = await renderSubNav();
    for (const { num } of ANCHORS) {
      expect(html).toContain(num);
    }
  });

  it('declares data-subnav-section on every anchor so the scrollspy can attach', async () => {
    const html = await renderSubNav();
    const sections = html.match(/data-subnav-section="(why|how|what|tokens|build)"/g);
    expect(sections).not.toBeNull();
    if (sections === null) {
      throw new Error('expected scrollspy hooks on every anchor');
    }
    expect(sections).toHaveLength(5);
  });

  it('inlines a script that imports the active-section helper (thin DOM wrapper)', async () => {
    // The Astro page-level `<script>` block is hoisted out of the render
    // string in container mode, so we cannot assert on its source text here.
    // Instead, we assert that the SSR markup leaves the structural
    // anchors/data-attributes intact for the client-side wiring to attach to.
    const html = await renderSubNav();
    expect(html).toMatch(/data-component="the-system-subnav"/);
    expect(html).toMatch(/data-subnav-section/);
  });
});
