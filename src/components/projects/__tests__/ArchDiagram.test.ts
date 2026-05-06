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

  it('does not declare a margin on the .arch rule (cleanup iter 4)', () => {
    const css = readFileSync(resolve(__dirname, '../ArchDiagram.module.css'), 'utf8');
    const match = css.match(/\.arch\s*\{([^}]*)\}/);
    const body = match?.[1];
    if (body === undefined) {
      throw new Error('expected to find a .arch rule in ArchDiagram.module.css');
    }
    expect(body).not.toMatch(/(^|\s|;)margin\s*:/);
  });

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
