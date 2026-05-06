import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import MetricGrid from '@/components/projects/MetricGrid.astro';

async function renderMetricGrid(slot: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(MetricGrid, {
    slots: { default: slot },
  });
}

describe('MetricGrid (render-test)', () => {
  it('renders the root as a <div>', async () => {
    const html = await renderMetricGrid('<span>m</span>');
    expect(html).toMatch(/^\s*<div\b/);
  });

  it('renders the slot content verbatim inside the grid', async () => {
    const html = await renderMetricGrid('<span data-x="metric-marker">M</span>');
    expect(html).toContain('<span data-x="metric-marker">M</span>');
  });

  it('applies a class on the root that resolves from the CSS module (not the literal "metric-grid")', async () => {
    const html = await renderMetricGrid('<span>m</span>');
    const rootMatch = html.match(/^\s*<div[^>]*class="([^"]+)"/);
    expect(rootMatch).not.toBeNull();
    const classValue = rootMatch?.[1] ?? '';
    expect(classValue.length).toBeGreaterThan(0);
    expect(classValue).not.toBe('metric-grid');
  });

  it('does not declare a margin on the .grid rule (cleanup iter 4)', () => {
    const css = readFileSync(resolve(__dirname, '../MetricGrid.module.css'), 'utf8');
    const match = css.match(/\.grid\s*\{([^}]*)\}/);
    const body = match?.[1];
    if (body === undefined) {
      throw new Error('expected to find a .grid rule in MetricGrid.module.css');
    }
    expect(body).not.toMatch(/(^|\s|;)margin\s*:/);
  });
});
