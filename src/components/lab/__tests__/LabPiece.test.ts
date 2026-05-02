import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import LabPiece from '@/components/lab/LabPiece.astro';
import type { LabPiece as LabPieceData } from '@/lib/schemas/lab';

const kineticPiece: LabPieceData = {
  key: 'kinetic',
  num: '01',
  title: { es: 'Kinetic Type', en: 'Kinetic Type' },
  description: {
    es: 'Variable font reaccionando al cursor.',
    en: 'Variable font reacting to the cursor.',
  },
  tags: ['CSS', 'variable fonts', 'pointer events'],
  words: ['distributed', 'resilient', 'observable', 'elastic', 'event-driven', 'cloud-native'],
};

const gridPiece: LabPieceData = {
  key: 'grid',
  num: '02',
  title: { es: 'Campo generativo', en: 'Generative field' },
  description: {
    es: 'Flow field con ruido Perlin simple.',
    en: 'Flow field with simple Perlin noise.',
  },
  tags: ['Canvas', 'noise', 'requestAnimationFrame'],
};

const marqueePiece: LabPieceData = {
  key: 'marquee',
  num: '03',
  title: { es: 'Marquee con scrub', en: 'Scrubbable marquee' },
  description: {
    es: 'El cursor controla la velocidad.',
    en: 'Cursor drives speed.',
  },
  tags: ['CSS animations', 'pointer math'],
  words: ['build', 'break', 'observe', 'iterate', 'ship'],
};

async function renderLabPiece(piece: LabPieceData): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LabPiece, { props: { piece } });
}

describe('LabPiece (render-test)', () => {
  it('renders an <article> with data-piece equal to the piece key', async () => {
    const html = await renderLabPiece(kineticPiece);
    expect(html).toMatch(/<article[^>]*data-piece="kinetic"/);
  });

  it('renders the kinetic stage with the six words when key is "kinetic"', async () => {
    const html = await renderLabPiece(kineticPiece);
    expect(html).toMatch(/id="stage-kinetic"/);
    for (const word of kineticPiece.words ?? []) {
      expect(html).toMatch(new RegExp(`<span[^>]*>${word}</span>`));
    }
  });

  it('renders the meta block with the num, h3 title (bilingual) and description (bilingual) for kinetic', async () => {
    const html = await renderLabPiece(kineticPiece);
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Kinetic Type<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Kinetic Type<\/span>/);
    expect(html).toContain('Variable font reaccionando al cursor.');
    expect(html).toContain('Variable font reacting to the cursor.');
  });

  it('renders all tags from the piece as Tag spans', async () => {
    const html = await renderLabPiece(kineticPiece);
    expect(html).toMatch(/<span[^>]*>CSS<\/span>/);
    expect(html).toMatch(/<span[^>]*>variable fonts<\/span>/);
    expect(html).toMatch(/<span[^>]*>pointer events<\/span>/);
  });

  it('renders the canvas-field stage for the grid piece (not the placeholder)', async () => {
    const html = await renderLabPiece(gridPiece);
    expect(html).toMatch(/<article[^>]*data-piece="grid"/);
    expect(html).not.toMatch(/id="stage-kinetic"/);
    expect(html).toMatch(/id="stage-canvas-field"/);
    expect(html).toMatch(/<canvas[^>]*id="canvas-field-surface"/);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Próximamente<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Campo generativo<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Generative field<\/span>/);
  });

  it('renders the marquee stage for the marquee piece (not the placeholder)', async () => {
    const html = await renderLabPiece(marqueePiece);
    expect(html).toMatch(/<article[^>]*data-piece="marquee"/);
    expect(html).not.toMatch(/id="stage-kinetic"/);
    expect(html).not.toMatch(/id="stage-canvas-field"/);
    expect(html).toMatch(/id="stage-marquee"/);
    expect(html).toMatch(/id="marquee-track"/);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Próximamente<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Marquee con scrub<\/span>/);
    expect(html).toMatch(/<h3[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Scrubbable marquee<\/span>/);
    for (const word of marqueePiece.words ?? []) {
      const matches = html.match(new RegExp(`<span[^>]*>${word}</span>`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected three spans for word "${word}"`);
      }
      expect(matches).toHaveLength(3);
    }
  });

  it('renders the num verbatim for the grid piece (02)', async () => {
    const html = await renderLabPiece(gridPiece);
    expect(html).toMatch(/<span[^>]*>02<\/span>/);
  });

  it('renders the num verbatim for the marquee piece (03)', async () => {
    const html = await renderLabPiece(marqueePiece);
    expect(html).toMatch(/<span[^>]*>03<\/span>/);
  });
});
