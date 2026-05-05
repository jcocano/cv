import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import BaseLayout from '@/layouts/BaseLayout.astro';
import { CONSOLE_SIGNATURE, CONSOLE_SIGNATURE_PARTS } from '@/lib/runtime/console-signature';

async function renderBaseLayout(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    slots: { default: '<p>body</p>' },
  });
}

describe('BaseLayout (console signature script)', () => {
  it('emits an inline <script> in the head whose body invokes console.info', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const matchingScript = inlineScripts.find((script) => script.includes('console.info'));
    expect(matchingScript).toBeDefined();
  });

  it('guards the console.info call with the window.__cv_signature_shown flag', async () => {
    const html = await renderBaseLayout();
    expect(html).toContain('__cv_signature_shown');
  });

  it('serializes the exact format string produced by buildConsoleSignature(CONSOLE_SIGNATURE_PARTS)', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const consoleScript = inlineScripts.find((script) => script.includes('console.info'));
    expect(consoleScript).toBeDefined();
    if (consoleScript === undefined) {
      throw new Error('expected an inline script containing console.info');
    }
    const serializedFormat = JSON.stringify(CONSOLE_SIGNATURE.format);
    expect(consoleScript).toContain(serializedFormat);
  });

  it('serializes each CSS style produced by buildConsoleSignature(CONSOLE_SIGNATURE_PARTS)', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const consoleScript = inlineScripts.find((script) => script.includes('console.info'));
    expect(consoleScript).toBeDefined();
    if (consoleScript === undefined) {
      throw new Error('expected an inline script containing console.info');
    }
    for (const style of CONSOLE_SIGNATURE.styles) {
      expect(consoleScript).toContain(JSON.stringify(style));
    }
  });

  it('includes the literal contact mailto from CONSOLE_SIGNATURE_PARTS in the script body', async () => {
    const html = await renderBaseLayout();
    const inlineScripts = html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? [];
    const consoleScript = inlineScripts.find((script) => script.includes('console.info'));
    expect(consoleScript).toBeDefined();
    if (consoleScript === undefined) {
      throw new Error('expected an inline script containing console.info');
    }
    expect(consoleScript).toContain(CONSOLE_SIGNATURE_PARTS.contact);
  });
});
