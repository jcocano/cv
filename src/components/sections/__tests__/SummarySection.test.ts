import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SummarySection from '@/components/sections/SummarySection.astro';
import summaryStyles from '@/components/sections/SummarySection.module.css';
import summaryJson from '@/data/summary.json';

async function renderSummary(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SummarySection);
}

describe('SummarySection (render-test)', () => {
  it('renders the section root as <section id="summary">', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/<section[^>]*id="summary"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/<section[^>]*id="summary"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead with the summary eyebrow num "01" and bilingual labels', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>resumen<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>summary<\/span>/);
  });

  it('renders the bilingual h2 title from summary.json', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Backend profundo[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Deep backend[\s\S]*<\/h2>/);
  });

  it('renders the bilingual lede paragraph from summary.json', async () => {
    const html = await renderSummary();
    expect(html).toContain(
      '8 años de ingeniería de backend sobre 12 años trabajando con sistemas.',
    );
    expect(html).toContain(
      '8 years of backend engineering on top of 12 years working with systems.',
    );
  });

  it('renders all four stats with their value, accent and bilingual labels', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/>\s*8\s*<span[^>]*>\+<\/span>/);
    expect(html).toMatch(/>\s*12\s*<span[^>]*>\+<\/span>/);
    expect(html).toMatch(/>\s*2\s*<span[^>]*>×<\/span>/);
    expect(html).toMatch(/>\s*5\s*<\/span>/);
    const accentMatches = html.match(/<span[^>]*>\+<\/span>/g);
    expect(accentMatches).not.toBeNull();
    if (accentMatches === null) {
      throw new Error('expected at least one "+" accent span');
    }
    expect(accentMatches.length).toBeGreaterThanOrEqual(2);
    expect(html).toMatch(/<span[^>]*>×<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>años en backend distribuido<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>years in distributed backend<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>años de base en sysadmin &amp; redes<\/span>/);
    expect(html).toMatch(
      /<span[^>]*lang="en"[^>]*>years of sysadmin &amp; networking foundation<\/span>/,
    );
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>clouds en producción \(AWS · GCP\)<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>production clouds \(AWS · GCP\)<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>stacks de mensajería en producción<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>messaging stacks in production<\/span>/);
  });

  it('does not render an accent <span> inside the null-accent stat (tile #4, value 5)', async () => {
    const html = await renderSummary();
    const tileFourNumMatch = html.match(/<span[^>]*>\s*5\s*<\/span>/);
    expect(tileFourNumMatch).not.toBeNull();
    const allAccents = html.match(/<span[^>]*>[+×]<\/span>/g) ?? [];
    expect(allAccents).toHaveLength(3);
  });

  it('renders a paragraph for each summary body block with its lang attribute', async () => {
    const html = await renderSummary();
    const esBody = summaryJson.paragraphs.es[0];
    const enBody = summaryJson.paragraphs.en[0];
    if (esBody === undefined || enBody === undefined) {
      throw new Error('summary.json paragraphs must have at least one entry per lang');
    }
    expect(html).toMatch(new RegExp(`<p[^>]*lang="es"[^>]*>[\\s\\S]*${esBody.slice(0, 30)}`));
    expect(html).toMatch(new RegExp(`<p[^>]*lang="en"[^>]*>[\\s\\S]*${enBody.slice(0, 30)}`));
  });

  it('renders the expertise list with one <li> per item containing both languages', async () => {
    const html = await renderSummary();
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
    expect(liMatches).toHaveLength(7);
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
    expect(ulInner).toMatch(
      /<span[^>]*lang="es"[^>]*>Backends AI-native: MCP servers, RAG con vector stores y LLM tooling<\/span>/,
    );
    expect(ulInner).toMatch(
      /<span[^>]*lang="en"[^>]*>AI-native backends: MCP servers, RAG with vector stores, and LLM tooling<\/span>/,
    );
  });

  it('adds the global "reveal" class on the SectionHead wrapper (handoff L109)', async () => {
    const html = await renderSummary();
    expect(html).toMatch(/<div\b[^>]*class="[^"]*\breveal\b[^"]*"[^>]*>\s*<span/);
  });

  it('adds the global "reveal" class on the .stats container (handoff L123)', async () => {
    const html = await renderSummary();
    const statsClassName = summaryStyles.stats;
    if (statsClassName === undefined) {
      throw new Error('summaryStyles.stats must be defined');
    }
    const statsMatches = html.match(/<div\b[^>]*class="([^"]+)"/g) ?? [];
    const statsHit = statsMatches.find(
      (tag) => tag.includes(statsClassName) && /\breveal\b/.test(tag),
    );
    expect(statsHit).toBeDefined();
  });

  it('adds the global "reveal" class on each summary-body paragraph (handoff L130/L133)', async () => {
    const html = await renderSummary();
    const summaryBodyClassName = summaryStyles.summaryBody;
    if (summaryBodyClassName === undefined) {
      throw new Error('summaryStyles.summaryBody must be defined');
    }
    const pTagMatches = html.match(/<p\b[^>]*>/g) ?? [];
    const summaryBodyHits = pTagMatches.filter(
      (tag) => tag.includes(summaryBodyClassName) && /\breveal\b/.test(tag),
    );
    expect(summaryBodyHits.length).toBeGreaterThanOrEqual(2);
  });

  it('adds the global "reveal" class on the .bullets <ul> (handoff L137)', async () => {
    const html = await renderSummary();
    const bulletsClassName = summaryStyles.bullets;
    if (bulletsClassName === undefined) {
      throw new Error('summaryStyles.bullets must be defined');
    }
    const ulMatches = html.match(/<ul\b[^>]*>/g) ?? [];
    const ulHit = ulMatches.find((tag) => tag.includes(bulletsClassName) && /\breveal\b/.test(tag));
    expect(ulHit).toBeDefined();
  });
});
