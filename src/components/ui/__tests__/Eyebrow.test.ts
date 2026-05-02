import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Eyebrow from '@/components/ui/Eyebrow.astro';

async function renderEyebrow(num: string, labelEs: string, labelEn: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Eyebrow, { props: { num, labelEs, labelEn } });
}

describe('Eyebrow (render-test)', () => {
  it('renders the num inside a <span class="num"> with the exact value received', async () => {
    const html = await renderEyebrow('01', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*class="[^"]*num[^"]*"[^>]*>01<\/span>/);
  });

  it('renders the Spanish label inside <span lang="es">', async () => {
    const html = await renderEyebrow('02', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>disponible<\/span>/);
  });

  it('renders the English label inside <span lang="en">', async () => {
    const html = await renderEyebrow('02', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>available<\/span>/);
  });

  it('wraps everything in a <span class="eyebrow"> with the "/" separator between num and labels', async () => {
    const html = await renderEyebrow('03', 'foo', 'bar');
    expect(html).toMatch(/<span[^>]*class="[^"]*eyebrow[^"]*"/);
    expect(html).toMatch(/<\/span>\s*\/\s*\n?\s*<span[^>]*lang="es"/);
  });

  it('preserves the exact num string verbatim (no coercion)', async () => {
    const html = await renderEyebrow('99', 'a', 'b');
    expect(html).toMatch(/<span[^>]*class="[^"]*num[^"]*"[^>]*>99<\/span>/);
  });
});
