import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import CanvasField from '@/components/lab/CanvasField.astro';

async function renderCanvasField(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CanvasField);
}

describe('CanvasField (render-test)', () => {
  it('renders the stage with id="stage-canvas-field" so the script can locate it', async () => {
    const html = await renderCanvasField();
    expect(html).toMatch(/id="stage-canvas-field"/);
  });

  it('renders a single <canvas> element inside the stage', async () => {
    const html = await renderCanvasField();
    const matches = html.match(/<canvas[^>]*>/g);
    expect(matches).not.toBeNull();
    if (matches === null) {
      throw new Error('expected at least one canvas element');
    }
    expect(matches).toHaveLength(1);
  });

  it('marks the canvas with id="canvas-field-surface" so the script can attach to it', async () => {
    const html = await renderCanvasField();
    expect(html).toMatch(/<canvas[^>]*id="canvas-field-surface"/);
  });

  it('marks the canvas with aria-hidden="true" because it is decorative', async () => {
    const html = await renderCanvasField();
    expect(html).toMatch(/<canvas[^>]*aria-hidden="true"/);
  });
});
