import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import StackSection from '@/components/sections/StackSection.astro';

async function renderStackSection(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(StackSection);
}

describe('StackSection (render-test)', () => {
  it('renders the section root as <section id="stack">', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<section[^>]*id="stack"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<section[^>]*id="stack"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead eyebrow with num="03" and the bilingual labels (perfil técnico / technical)', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<span[^>]*>03<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>perfil técnico<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>technical<\/span>/);
  });

  it('renders a bilingual h2 title with both Spanish and English versions split with <br/>', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Stack &[\s\S]*especialización\.<\/span>/,
    );
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Stack &[\s\S]*specialization\.<\/span>/,
    );
  });

  it('renders the bilingual lede paragraph from the handoff (Tools I use in production every day)', async () => {
    const html = await renderStackSection();
    expect(html).toContain('Herramientas que uso a diario en producción.');
    expect(html).toContain('Tools I use in production every day.');
  });

  it('renders exactly seven .stack-cat blocks (one per category from the handoff)', async () => {
    const html = await renderStackSection();
    const matches = html.match(/<div[^>]*class="[^"]*stackCat|<div[^>]*class="[^"]*stack-cat/g);
    // CSS modules hashes the class but keeps the camelCase root in the name. Match either source.
    const camelMatches = html.match(/class="[^"]*stackCat/g);
    expect(camelMatches).not.toBeNull();
    if (camelMatches === null) {
      throw new Error('expected seven stack-cat blocks');
    }
    expect(camelMatches).toHaveLength(7);
    void matches;
  });

  it('renders the first category (Languages) with bilingual title spans and num="06" (six tags)', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Lenguajes<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Languages<\/span>/);
    // The first category block should expose num=06 (6 tags). Locate the first
    // .stackCat and assert it contains num=06 before the next .stackCat starts.
    const firstCatStart = html.search(/class="[^"]*stackCat/);
    expect(firstCatStart).toBeGreaterThan(-1);
    const afterFirst = html.slice(firstCatStart);
    const secondCatStart = afterFirst.slice(1).search(/class="[^"]*stackCat/);
    const firstCatBlock =
      secondCatStart === -1 ? afterFirst : afterFirst.slice(0, secondCatStart + 1);
    expect(firstCatBlock).toMatch(/>06</);
  });

  it('renders the Messaging & Data category with num="07" and seven chips', async () => {
    const html = await renderStackSection();
    // Astro escapes the literal "&" as the HTML entity "&amp;" in the
    // serialised output, which is the correct behaviour for valid HTML.
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Mensajería &amp; Datos<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Messaging &amp; Data<\/span>/);
    // Locate the Messaging & Data block by its English label and check that the
    // following chunk (until the next stackCat) has num=07 and 7 chips.
    const labelIdx = html.indexOf('Messaging &amp; Data');
    expect(labelIdx).toBeGreaterThan(-1);
    const afterLabel = html.slice(labelIdx);
    const nextCatStart = afterLabel.search(/class="[^"]*stackCat/);
    const block = nextCatStart === -1 ? afterLabel : afterLabel.slice(0, nextCatStart);
    expect(block).toMatch(/>07</);
    const chipMatches = block.match(/class="[^"]*chip/g);
    expect(chipMatches).not.toBeNull();
    if (chipMatches === null) {
      throw new Error('expected seven chip spans for Messaging & Data');
    }
    expect(chipMatches).toHaveLength(7);
    expect(block).toContain('PostgreSQL');
    expect(block).toContain('Apache Kafka');
    expect(block).toContain('Salesforce');
  });

  it('renders unilingual handoff categories (Frameworks, Cloud & DevOps, AI / LLMs) with the same string in both lang spans', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Frameworks<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Frameworks<\/span>/);
    // Astro escapes "&" as "&amp;" in the serialised HTML.
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Cloud &amp; DevOps<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Cloud &amp; DevOps<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>AI \/ LLMs<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>AI \/ LLMs<\/span>/);
  });

  it('renders every chip with the chip class (CSS module camelCase)', async () => {
    const html = await renderStackSection();
    // Total chips across the seven categories from the handoff: 6 + 6 + 6 + 7 + 5 + 6 + 6 = 42
    const chipMatches = html.match(/class="[^"]*chip/g);
    expect(chipMatches).not.toBeNull();
    if (chipMatches === null) {
      throw new Error('expected chip spans');
    }
    expect(chipMatches).toHaveLength(42);
  });

  it('applies the global "reveal" class to the stack grid wrapper', async () => {
    const html = await renderStackSection();
    expect(html).toMatch(/<div[^>]*class="[^"]*reveal[^"]*"[^>]*>[\s\S]*class="[^"]*stackCat/);
  });

  it('renders the Tools category with five chips (Git, Prometheus, Grafana, ELK Stack, JIRA · Agile) and num="05"', async () => {
    const html = await renderStackSection();
    const labelIdx = html.indexOf('>Tools<');
    expect(labelIdx).toBeGreaterThan(-1);
    const afterLabel = html.slice(labelIdx);
    const nextCatStart = afterLabel.search(/class="[^"]*stackCat/);
    const block = nextCatStart === -1 ? afterLabel : afterLabel.slice(0, nextCatStart);
    expect(block).toMatch(/>05</);
    expect(block).toContain('Git');
    expect(block).toContain('Prometheus');
    expect(block).toContain('Grafana');
    expect(block).toContain('ELK Stack');
    expect(block).toContain('JIRA · Agile');
  });
});
