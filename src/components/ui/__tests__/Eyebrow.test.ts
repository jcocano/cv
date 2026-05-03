import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Eyebrow from '@/components/ui/Eyebrow.astro';

async function renderEyebrow(num: string, labelEs: string, labelEn: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Eyebrow, { props: { num, labelEs, labelEn } });
}

async function renderEyebrowWithReveal(
  num: string,
  labelEs: string,
  labelEn: string,
  reveal: boolean,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Eyebrow, { props: { num, labelEs, labelEn, reveal } });
}

describe('Eyebrow (render-test)', () => {
  it('renders the num inside its own <span> with the exact value received', async () => {
    const html = await renderEyebrow('01', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
  });

  it('renders the Spanish label inside <span lang="es"> with the exact text', async () => {
    const html = await renderEyebrow('02', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>disponible<\/span>/);
  });

  it('renders the English label inside <span lang="en"> with the exact text', async () => {
    const html = await renderEyebrow('02', 'disponible', 'available');
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>available<\/span>/);
  });

  it('renders the "/" separator between the num span and the Spanish label span', async () => {
    const html = await renderEyebrow('03', 'foo', 'bar');
    expect(html).toMatch(/>03<\/span>\s*\/\s*<span[^>]*lang="es"[^>]*>foo<\/span>/);
  });

  it('preserves the exact num string verbatim (no coercion) for arbitrary values', async () => {
    const html = await renderEyebrow('99', 'a', 'b');
    expect(html).toMatch(/<span[^>]*>99<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>a<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>b<\/span>/);
  });

  it('does NOT add the global "reveal" class on the root span by default (reveal prop omitted)', async () => {
    const html = await renderEyebrow('01', 'foo', 'bar');
    const rootSpanMatch = html.match(/^\s*<span\b[^>]*>/);
    expect(rootSpanMatch).not.toBeNull();
    if (rootSpanMatch === null) {
      throw new Error('expected a root <span> element');
    }
    const classAttrMatch = rootSpanMatch[0].match(/class="([^"]+)"/);
    expect(classAttrMatch).not.toBeNull();
    if (classAttrMatch === null || classAttrMatch[1] === undefined) {
      throw new Error('expected a class attribute on the root <span>');
    }
    const classTokens = classAttrMatch[1].split(/\s+/).filter((token) => token.length > 0);
    expect(classTokens).not.toContain('reveal');
  });

  it('adds the global "reveal" class on the root span when reveal={true}', async () => {
    const html = await renderEyebrowWithReveal('01', 'foo', 'bar', true);
    const rootSpanMatch = html.match(/^\s*<span\b[^>]*>/);
    expect(rootSpanMatch).not.toBeNull();
    if (rootSpanMatch === null) {
      throw new Error('expected a root <span> element');
    }
    const classAttrMatch = rootSpanMatch[0].match(/class="([^"]+)"/);
    expect(classAttrMatch).not.toBeNull();
    if (classAttrMatch === null || classAttrMatch[1] === undefined) {
      throw new Error('expected a class attribute on the root <span>');
    }
    const classTokens = classAttrMatch[1].split(/\s+/).filter((token) => token.length > 0);
    expect(classTokens).toContain('reveal');
  });
});
