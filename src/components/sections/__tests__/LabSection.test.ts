import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import LabSection from '@/components/sections/LabSection.astro';

async function renderLabSection(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LabSection);
}

describe('LabSection (render-test)', () => {
  it('renders the section root as <section id="lab">', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<section[^>]*id="lab"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<section[^>]*id="lab"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead eyebrow with the ◢ symbol and the bilingual "Lab" labels', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<span[^>]*>◢<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Lab<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Lab<\/span>/);
  });

  it('renders a bilingual h2 title from lab.json with both Spanish and English versions', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Frontend[\s\S]*cuando el backend lo pide\.[\s\S]*<\/h2>/);
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*Frontend[\s\S]*when the backend asks for it\.[\s\S]*<\/h2>/,
    );
  });

  it('renders the bilingual lede paragraph (small live pieces text)', async () => {
    const html = await renderLabSection();
    expect(html).toContain('Pequeñas piezas en vivo');
    expect(html).toContain('Small live pieces');
  });

  it('renders three pieces (one h3 per piece, all bilingual)', async () => {
    const html = await renderLabSection();
    const h3Matches = html.match(/<h3[^>]*>/g);
    expect(h3Matches).not.toBeNull();
    if (h3Matches === null) {
      throw new Error('expected three h3 elements');
    }
    expect(h3Matches).toHaveLength(3);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Kinetic Type<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Campo generativo<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Marquee con scrub<\/span>/);
  });

  it('renders the kinetic piece with the six Spanish words from lab.json', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/id="stage-kinetic"/);
    const wordsEs = [
      'distribuido',
      'resiliente',
      'observable',
      'elástico',
      'event-driven',
      'cloud-native',
    ];
    for (const word of wordsEs) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders the kinetic piece with the six English words from lab.json', async () => {
    const html = await renderLabSection();
    const wordsEn = [
      'distributed',
      'resilient',
      'observable',
      'elastic',
      'event-driven',
      'cloud-native',
    ];
    for (const word of wordsEn) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders the marquee stage for the marquee piece (no Coming soon placeholder anywhere)', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/id="stage-marquee"/);
    expect(html).toMatch(/id="marquee-track"/);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Próximamente<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Coming soon<\/span>/);
  });

  it('renders the marquee piece with the five Spanish words from lab.json, repeated three times each', async () => {
    const html = await renderLabSection();
    const wordsEs = ['construir', 'romper', 'observar', 'iterar', 'lanzar'];
    for (const word of wordsEs) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for Spanish word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders the marquee piece with the five English words from lab.json, repeated three times each', async () => {
    const html = await renderLabSection();
    const wordsEn = ['build', 'break', 'observe', 'iterate', 'ship'];
    for (const word of wordsEn) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for English word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders the canvas-field stage for the grid piece (now interactive)', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/id="stage-canvas-field"/);
    expect(html).toMatch(/<canvas[^>]*id="canvas-field-surface"/);
  });

  it('applies the global "reveal" class to the lab grid wrapper', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(
      /<div[^>]*class="[^"]*reveal[^"]*"[^>]*>[\s\S]*<article[^>]*data-piece="kinetic"/,
    );
  });

  it('renders three articles, one per piece, with their data-piece attribute', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<article[^>]*data-piece="kinetic"/);
    expect(html).toMatch(/<article[^>]*data-piece="grid"/);
    expect(html).toMatch(/<article[^>]*data-piece="marquee"/);
  });

  it('renders the discreet the-system link at the end of the lab grid', async () => {
    const html = await renderLabSection();
    expect(html).toMatch(/<a[^>]*href="[^"]*the-system\/"/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>El sistema detrás de estas piezas →<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>The system behind these pieces →<\/span>/);
  });
});
