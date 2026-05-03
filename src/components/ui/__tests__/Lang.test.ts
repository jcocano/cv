import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Lang from '@/components/ui/Lang.astro';

async function renderLang(lang: string, slot: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Lang, {
    props: { lang },
    slots: { default: slot },
  });
}

describe('Lang (render-test)', () => {
  it('renders a <div> with the lang attribute exactly equal to the prop value', async () => {
    const html = await renderLang('es', 'hola');
    expect(html).toMatch(/<div[^>]*lang="es"[^>]*>/);
  });

  it('renders the English variant with lang="en" when prop is "en"', async () => {
    const html = await renderLang('en', 'hello');
    expect(html).toMatch(/<div[^>]*lang="en"[^>]*>/);
  });

  it('renders the slot content verbatim inside the <div>', async () => {
    const html = await renderLang('es', '<p>contenido</p>');
    expect(html).toContain('<p>contenido</p>');
  });

  it('uses a <div> root element (not <span>) so it can wrap block-level children safely', async () => {
    const html = await renderLang('en', 'x');
    const trimmed = html.trim();
    expect(trimmed.startsWith('<div')).toBe(true);
    expect(trimmed.endsWith('</div>')).toBe(true);
  });
});
