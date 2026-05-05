import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import BaseLayout from '@/layouts/BaseLayout.astro';
import { WINDOW_ENVS_PAYLOAD } from '@/lib/runtime/window-envs';

async function renderBaseLayout(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    slots: { default: '<p>body</p>' },
  });
}

describe('BaseLayout (window.envs script)', () => {
  it('emits an inline <script> in the head whose body assigns window.envs', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const matchingScript = inlineScripts.find((script) => /window\.envs\s*=/.test(script));
    expect(matchingScript).toBeDefined();
  });

  it('serializes the exact WINDOW_ENVS_PAYLOAD literal in the script body', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const envsScript = inlineScripts.find((script) => /window\.envs\s*=/.test(script));
    expect(envsScript).toBeDefined();
    if (envsScript === undefined) {
      throw new Error('expected an inline script that assigns window.envs');
    }
    const serializedPayload = JSON.stringify(WINDOW_ENVS_PAYLOAD);
    expect(envsScript).toContain(serializedPayload);
  });
});
