import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SectionHead from '@/components/ui/SectionHead.astro';
import sectionHeadStyles from '@/components/ui/SectionHead.module.css';

type SectionHeadProps = {
  num: string;
  labelEs: string;
  labelEn: string;
  titleEs: string;
  titleEn: string;
  ledeEs?: string;
  ledeEn?: string;
};

async function renderSectionHead(props: SectionHeadProps): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SectionHead, { props: { ...props } });
}

function ledeClassName(): string {
  const className = sectionHeadStyles.lede;
  if (className === undefined) {
    throw new Error('sectionHeadStyles.lede must be defined');
  }
  return className;
}

function findLedeParagraph(html: string): string | null {
  const className = ledeClassName();
  // Build a regex that matches <p ... class="... <ledeClass> ..." ...>...</p>.
  // The className is hashed (e.g. "_lede_abc123") and may appear alongside other
  // tokens in the class attribute. Escape it for safe regex use.
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<p\\b[^>]*class="[^"]*\\b${escaped}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/p>`);
  const match = html.match(re);
  return match === null ? null : (match[1] ?? '');
}

const sampleProps: SectionHeadProps = {
  num: '01',
  labelEs: 'resumen',
  labelEn: 'summary',
  titleEs: 'Backend profundo,\ninfraestructura más profunda.',
  titleEn: 'Deep backend,\ndeeper infrastructure.',
  ledeEs: '7+ años en sistemas distribuidos · 12+ años en infraestructura y operaciones.',
  ledeEn: '7+ years in distributed systems · 12+ years in infrastructure & ops.',
};

describe('SectionHead (render-test)', () => {
  it('renders the eyebrow num inside its own <span> with the exact value', async () => {
    const html = await renderSectionHead(sampleProps);
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
  });

  it('renders the Spanish eyebrow label inside <span lang="es">', async () => {
    const html = await renderSectionHead(sampleProps);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>resumen<\/span>/);
  });

  it('renders the English eyebrow label inside <span lang="en">', async () => {
    const html = await renderSectionHead(sampleProps);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>summary<\/span>/);
  });

  it('renders the "/" separator between the eyebrow num and the Spanish label', async () => {
    const html = await renderSectionHead(sampleProps);
    expect(html).toMatch(/>01<\/span>\s*\/\s*<span[^>]*lang="es"[^>]*>resumen<\/span>/);
  });

  it('renders an <h2> containing both Spanish and English title spans', async () => {
    const html = await renderSectionHead(sampleProps);
    const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    expect(h2Match).not.toBeNull();
    if (h2Match === null) {
      throw new Error('expected an h2 element');
    }
    const h2Inner = h2Match[1] ?? '';
    expect(h2Inner).toMatch(/<span[^>]*lang="es"[^>]*>[\s\S]*Backend profundo[\s\S]*<\/span>/);
    expect(h2Inner).toMatch(/<span[^>]*lang="en"[^>]*>[\s\S]*Deep backend[\s\S]*<\/span>/);
  });

  it('preserves the line break in the title as <br> inside each lang span', async () => {
    const html = await renderSectionHead(sampleProps);
    expect(html).toMatch(
      /<span[^>]*lang="es"[^>]*>Backend profundo,\s*<br[^>]*>\s*infraestructura/,
    );
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Deep backend,\s*<br[^>]*>\s*deeper/);
  });

  it('renders a <p> with both lede language spans', async () => {
    const html = await renderSectionHead(sampleProps);
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    expect(pMatch).not.toBeNull();
    if (pMatch === null) {
      throw new Error('expected a p element');
    }
    const pInner = pMatch[1] ?? '';
    expect(pInner).toMatch(/<span[^>]*lang="es"[^>]*>7\+ años[\s\S]*<\/span>/);
    expect(pInner).toMatch(/<span[^>]*lang="en"[^>]*>7\+ years[\s\S]*<\/span>/);
  });

  it('adds the global "reveal" class on the outer wrapper div', async () => {
    const html = await renderSectionHead(sampleProps);
    const wrapperMatch = html.match(/^\s*<div\b[^>]*>/);
    expect(wrapperMatch).not.toBeNull();
    if (wrapperMatch === null) {
      throw new Error('expected an outer <div> wrapper');
    }
    const classAttrMatch = wrapperMatch[0].match(/class="([^"]+)"/);
    expect(classAttrMatch).not.toBeNull();
    if (classAttrMatch === null || classAttrMatch[1] === undefined) {
      throw new Error('expected a class attribute on the outer <div>');
    }
    const classTokens = classAttrMatch[1].split(/\s+/).filter((token) => token.length > 0);
    expect(classTokens).toContain('reveal');
  });

  it('does NOT pass reveal={true} to the inner Eyebrow (the outer wrapper already carries reveal)', async () => {
    const html = await renderSectionHead(sampleProps);
    // The first <span> in the rendered html is the Eyebrow root span.
    const eyebrowSpanMatch = html.match(/<span\b[^>]*>/);
    expect(eyebrowSpanMatch).not.toBeNull();
    if (eyebrowSpanMatch === null) {
      throw new Error('expected an Eyebrow root <span>');
    }
    const classAttrMatch = eyebrowSpanMatch[0].match(/class="([^"]+)"/);
    expect(classAttrMatch).not.toBeNull();
    if (classAttrMatch === null || classAttrMatch[1] === undefined) {
      throw new Error('expected a class attribute on the Eyebrow root <span>');
    }
    const classTokens = classAttrMatch[1].split(/\s+/).filter((token) => token.length > 0);
    expect(classTokens).not.toContain('reveal');
  });

  it('does NOT render <p class=lede> when both ledeEs and ledeEn are absent (undefined)', async () => {
    const html = await renderSectionHead({
      num: '02',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Trayectoria\nprofesional.',
      titleEn: 'Career\ntimeline.',
    });
    expect(findLedeParagraph(html)).toBeNull();
  });

  it('does NOT render <p class=lede> when both ledeEs and ledeEn are empty strings', async () => {
    const html = await renderSectionHead({
      num: '02',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Trayectoria\nprofesional.',
      titleEn: 'Career\ntimeline.',
      ledeEs: '',
      ledeEn: '',
    });
    expect(findLedeParagraph(html)).toBeNull();
  });

  it('renders <p class=lede> with only the ES span when ledeEn is absent', async () => {
    const html = await renderSectionHead({
      num: '02',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Trayectoria\nprofesional.',
      titleEn: 'Career\ntimeline.',
      ledeEs: 'Solo en español.',
    });
    const pInner = findLedeParagraph(html);
    expect(pInner).not.toBeNull();
    if (pInner === null) {
      throw new Error('expected the lede <p> to be rendered');
    }
    expect(pInner).toMatch(/<span[^>]*lang="es"[^>]*>Solo en español\.<\/span>/);
    expect(pInner).not.toMatch(/<span[^>]*lang="en"/);
  });

  it('renders <p class=lede> with only the EN span when ledeEs is absent', async () => {
    const html = await renderSectionHead({
      num: '02',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Trayectoria\nprofesional.',
      titleEn: 'Career\ntimeline.',
      ledeEn: 'English only.',
    });
    const pInner = findLedeParagraph(html);
    expect(pInner).not.toBeNull();
    if (pInner === null) {
      throw new Error('expected the lede <p> to be rendered');
    }
    expect(pInner).toMatch(/<span[^>]*lang="en"[^>]*>English only\.<\/span>/);
    expect(pInner).not.toMatch(/<span[^>]*lang="es"/);
  });

  it('does NOT render the EN span inside the lede <p> when ledeEn is an empty string', async () => {
    const html = await renderSectionHead({
      num: '02',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Trayectoria\nprofesional.',
      titleEn: 'Career\ntimeline.',
      ledeEs: 'Solo ES.',
      ledeEn: '',
    });
    const pInner = findLedeParagraph(html);
    expect(pInner).not.toBeNull();
    if (pInner === null) {
      throw new Error('expected the lede <p> to be rendered');
    }
    expect(pInner).toMatch(/<span[^>]*lang="es"[^>]*>Solo ES\.<\/span>/);
    expect(pInner).not.toMatch(/<span[^>]*lang="en"/);
  });

  it('renders both num and labels for arbitrary props (no hard-coded values)', async () => {
    const html = await renderSectionHead({
      num: '07',
      labelEs: 'experiencia',
      labelEn: 'experience',
      titleEs: 'Otro título.',
      titleEn: 'Other title.',
      ledeEs: 'Lede ES.',
      ledeEn: 'Lede EN.',
    });
    expect(html).toMatch(/<span[^>]*>07<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>experiencia<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>experience<\/span>/);
    expect(html).toContain('Otro título.');
    expect(html).toContain('Other title.');
    expect(html).toContain('Lede ES.');
    expect(html).toContain('Lede EN.');
  });
});
