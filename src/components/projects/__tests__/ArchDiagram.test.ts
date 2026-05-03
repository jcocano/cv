import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ArchDiagram from '@/components/projects/ArchDiagram.astro';

async function renderArchDiagram(slot: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ArchDiagram, {
    slots: { default: slot },
  });
}

describe('ArchDiagram (render-test)', () => {
  it('renders the root as a <pre> element', async () => {
    const html = await renderArchDiagram('payload');
    expect(html).toMatch(/^\s*<pre\b/);
  });

  it('renders the slot content verbatim inside the <pre>', async () => {
    const slot = '<span class="h">[ on-chain events ]</span>\n   ▼\n<span class="c">indexer</span>';
    const html = await renderArchDiagram(slot);
    expect(html).toContain('<span class="h">[ on-chain events ]</span>');
    expect(html).toContain('<span class="c">indexer</span>');
  });

  it('applies a class on the root that is hashed by the CSS module (not the literal "arch")', async () => {
    const html = await renderArchDiagram('x');
    const rootMatch = html.match(/^\s*<pre[^>]*class="([^"]+)"/);
    expect(rootMatch).not.toBeNull();
    const classValue = rootMatch?.[1] ?? '';
    expect(classValue.length).toBeGreaterThan(0);
    expect(classValue).not.toBe('arch');
  });

  /**
   * Regression for feature #17 iter 4 (cleanup estructural):
   *
   * The previous implementation kept a hard-coded `margin: 28px 0` on the
   * `.arch` rule. The user explicitly requested removing it so spacing
   * between body children is governed by the parent `.body { gap: 28px }`,
   * not by per-component arithmetic. Re-introducing a vertical margin
   * would re-create the alignment bug fixed in iter 3.
   */
  it('does not declare a margin on the .arch rule (cleanup iter 4)', () => {
    const css = readFileSync(resolve(__dirname, '../ArchDiagram.module.css'), 'utf8');
    const match = css.match(/\.arch\s*\{([^}]*)\}/);
    const body = match?.[1];
    if (body === undefined) {
      throw new Error('expected to find a .arch rule in ArchDiagram.module.css');
    }
    expect(body).not.toMatch(/(^|\s|;)margin\s*:/);
  });

  /**
   * Regression for feature #17 iter 8 (fix font del <p> espurio):
   *
   * MDX wraps the inline text content of <ArchDiagram> (the `│`/`▼`/`──→`
   * text nodes between the `<span class="h">` / `<span class="c">` spans) in
   * a `<p>` element. That `<p>` is a descendant of `.body :global(p)` in
   * ProjectBody, so it inherits `font-size: 17px; line-height: 1.7;
   * color: var(--fg)` (sans serif) — breaking the `font-mono 12px
   * line-height 1.65 color fg-dim` of the `.arch` `<pre>`. On top of that
   * the default `white-space: normal` of `<p>` collapses the whitespace
   * runs and line breaks of the ASCII art.
   *
   * Fix: a CSS-module-local reset under `.arch :global(p)` that forces the
   * `<p>` to inherit typography from the `<pre>` and to preserve whitespace
   * via `white-space: pre`. Re-introducing any of these properties with a
   * non-inherit value would re-create the bug the user reported in iter 8.
   */
  it('declares a .arch :global(p) reset with the 6 inherit/whitespace props (iter 8)', () => {
    const css = readFileSync(resolve(__dirname, '../ArchDiagram.module.css'), 'utf8');
    const match = css.match(/\.arch\s+:global\(p\)\s*\{([^}]*)\}/);
    const body = match?.[1];
    if (body === undefined) {
      throw new Error('expected to find a .arch :global(p) rule in ArchDiagram.module.css');
    }
    expect(body).toMatch(/font-family\s*:\s*inherit\s*;/);
    expect(body).toMatch(/font-size\s*:\s*inherit\s*;/);
    expect(body).toMatch(/line-height\s*:\s*inherit\s*;/);
    expect(body).toMatch(/color\s*:\s*inherit\s*;/);
    expect(body).toMatch(/margin\s*:\s*0\s*;/);
    expect(body).toMatch(/white-space\s*:\s*pre\s*;/);
  });
});
