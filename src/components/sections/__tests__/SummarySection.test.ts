import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SummarySection from '@/components/sections/SummarySection.astro';
import summaryJson from '@/data/summary.json';

async function renderSummary(lang: 'es' | 'en'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SummarySection, { props: { lang } });
}

describe('SummarySection (render-test)', () => {
  it('renders the section root as <section id="summary">', async () => {
    const html = await renderSummary('es');
    expect(html).toMatch(/<section[^>]*id="summary"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderSummary('es');
    expect(html).toMatch(/<section[^>]*id="summary"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead with the summary eyebrow num "01" and bilingual labels', async () => {
    const html = await renderSummary('es');
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>resumen<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>summary<\/span>/);
  });

  it('renders the bilingual h2 title from summary.json', async () => {
    const html = await renderSummary('es');
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Backend profundo[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Deep backend[\s\S]*<\/h2>/);
  });

  it('renders the bilingual lede paragraph from summary.json', async () => {
    const html = await renderSummary('es');
    expect(html).toContain(
      '7+ años en sistemas distribuidos · 12+ años en infraestructura y operaciones.',
    );
    expect(html).toContain(
      '7+ years in distributed systems · 12+ years in infrastructure &amp; ops.',
    );
  });

  it('renders all four stats with their value, accent and bilingual labels', async () => {
    const html = await renderSummary('es');
    expect(html).toMatch(/>\s*7\s*<span[^>]*>\+<\/span>/);
    expect(html).toMatch(/>\s*12\s*<span[^>]*>\+<\/span>/);
    expect(html).toMatch(/>\s*2\s*<span[^>]*>×<\/span>/);
    expect(html).toMatch(/>\s*∞\s*<\/span>/);
    const accentMatches = html.match(/<span[^>]*>\+<\/span>/g);
    expect(accentMatches).not.toBeNull();
    if (accentMatches === null) {
      throw new Error('expected at least one "+" accent span');
    }
    expect(accentMatches.length).toBeGreaterThanOrEqual(2);
    expect(html).toMatch(/<span[^>]*>×<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>años en sistemas distribuidos<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>years in distributed systems<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>años en infra &amp; ops<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>years in infra &amp; ops<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>clouds en producción \(AWS · GCP\)<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>production clouds \(AWS · GCP\)<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>eventos procesados \(Kafka · Pulsar\)<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>events shipped \(Kafka · Pulsar\)<\/span>/);
  });

  it('does not render an accent <span> inside the infinity stat (accent: null)', async () => {
    const html = await renderSummary('es');
    const infinityNumMatch = html.match(/<span[^>]*>\s*∞\s*<\/span>/);
    expect(infinityNumMatch).not.toBeNull();
    const allAccents = html.match(/<span[^>]*>[+×]<\/span>/g) ?? [];
    expect(allAccents).toHaveLength(3);
  });

  it('renders a paragraph for each summary body block with its lang attribute', async () => {
    const html = await renderSummary('es');
    const esBody = summaryJson.paragraphs.es[0];
    const enBody = summaryJson.paragraphs.en[0];
    if (esBody === undefined || enBody === undefined) {
      throw new Error('summary.json paragraphs must have at least one entry per lang');
    }
    expect(html).toMatch(new RegExp(`<p[^>]*lang="es"[^>]*>[\\s\\S]*${esBody.slice(0, 30)}`));
    expect(html).toMatch(new RegExp(`<p[^>]*lang="en"[^>]*>[\\s\\S]*${enBody.slice(0, 30)}`));
  });

  it('renders the expertise list with one <li> per item containing both languages', async () => {
    const html = await renderSummary('es');
    const ulMatch = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
    expect(ulMatch).not.toBeNull();
    if (ulMatch === null) {
      throw new Error('expected a <ul> with the expertise bullets');
    }
    const ulInner = ulMatch[1] ?? '';
    const liMatches = ulInner.match(/<li[^>]*>/g);
    expect(liMatches).not.toBeNull();
    if (liMatches === null) {
      throw new Error('expected <li> elements');
    }
    expect(liMatches).toHaveLength(6);
    expect(ulInner).toMatch(
      /<span[^>]*lang="es"[^>]*>Sistemas backend cloud-native y arquitecturas distribuidas<\/span>/,
    );
    expect(ulInner).toMatch(
      /<span[^>]*lang="en"[^>]*>Cloud-native backend systems &amp; distributed architectures<\/span>/,
    );
    expect(ulInner).toMatch(
      /<span[^>]*lang="es"[^>]*>Liderazgo técnico en respuesta a incidentes<\/span>/,
    );
    expect(ulInner).toMatch(
      /<span[^>]*lang="en"[^>]*>Technical leadership in incident response<\/span>/,
    );
  });

  it('renders identical HTML regardless of the lang prop (content is fully bilingual)', async () => {
    const htmlEs = await renderSummary('es');
    const htmlEn = await renderSummary('en');
    expect(htmlEs).toBe(htmlEn);
  });
});
