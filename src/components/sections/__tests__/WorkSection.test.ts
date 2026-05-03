import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import WorkSection from '@/components/sections/WorkSection.astro';

async function renderWorkSection(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(WorkSection);
}

describe('WorkSection (render-test)', () => {
  it('renders the section root as <section id="work">', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<section[^>]*id="work"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<section[^>]*id="work"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead eyebrow with num="04" and bilingual labels (proyectos / selected work)', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*>04<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>proyectos<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>selected work<\/span>/);
  });

  it('renders the bilingual h2 title with both Spanish and English versions split with <br/>', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Trabajo[\s\S]*seleccionado\.<\/span>/,
    );
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Selected[\s\S]*projects\.<\/span>/,
    );
  });

  it('renders the bilingual lede paragraph from the handoff', async () => {
    const html = await renderWorkSection();
    expect(html).toContain(
      'Plataformas en producción, decisiones de arquitectura, e impacto medible.',
    );
    expect(html).toContain('Production platforms, architectural calls, and measurable impact.');
  });

  it('renders the featured project (Made by Apes) with the cardFeatured CSS-module class', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/class="[^"]*cardFeatured/);
    // Made by Apes shows up only once, but its meta line "Yuga Labs · 2025" must appear
    // before the rest of the cards in document order.
    expect(html).toContain('Yuga Labs · 2025');
  });

  it('renders exactly three project cards: 1 featured + 2 in the rest grid', async () => {
    const html = await renderWorkSection();
    const cardMatches = html.match(/class="[^"]*projectCard/g);
    expect(cardMatches).not.toBeNull();
    if (cardMatches === null) {
      throw new Error('expected three project cards');
    }
    expect(cardMatches).toHaveLength(3);
    const featuredMatches = html.match(/class="[^"]*cardFeatured/g);
    expect(featuredMatches).not.toBeNull();
    if (featuredMatches === null) {
      throw new Error('expected exactly one featured card');
    }
    expect(featuredMatches).toHaveLength(1);
  });

  it('places the featured card before the grid (document order)', async () => {
    const html = await renderWorkSection();
    const featuredIdx = html.search(/class="[^"]*cardFeatured/);
    const gridIdx = html.search(/class="[^"]*projectsGrid/);
    expect(featuredIdx).toBeGreaterThan(-1);
    expect(gridIdx).toBeGreaterThan(-1);
    expect(featuredIdx).toBeLessThan(gridIdx);
  });

  it('orders the grid cards by `order` ascending (Cluster Separation before Incommers NFT)', async () => {
    const html = await renderWorkSection();
    const clusterIdx = html.indexOf('Cluster Separation');
    const incommersIdx = html.indexOf('Incommers NFT');
    expect(clusterIdx).toBeGreaterThan(-1);
    expect(incommersIdx).toBeGreaterThan(-1);
    expect(clusterIdx).toBeLessThan(incommersIdx);
  });

  it('renders each project link with an href ending in /projects/<slug>', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/href="[^"]*\/projects\/made-by-apes"/);
    expect(html).toMatch(/href="[^"]*\/projects\/cluster-separation"/);
    expect(html).toMatch(/href="[^"]*\/projects\/incommers-nft"/);
  });

  it('renders the project meta lines for every project (company · year)', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('Yuga Labs · 2025');
    expect(html).toContain('tokenproof · 2023');
    expect(html).toContain('MetaOne · 2024');
  });

  it('renders the bilingual title for cluster-separation (es: Separación de Clusters / en: Cluster Separation)', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Separación de Clusters<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Cluster Separation<\/span>/);
  });

  it('renders the bilingual tagline (sub) for cluster-separation', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Aislamiento total vía IaC\.<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Total isolation via IaC\.<\/span>/);
  });

  it('renders the bilingual description text for every project card', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('Lideré la entrega de la plataforma');
    expect(html).toContain('Led delivery of the platform');
    expect(html).toContain('Entornos completamente aislados');
    expect(html).toContain('Fully isolated environments');
    expect(html).toContain('optimizando lógica del contrato');
    expect(html).toContain('optimized contract logic');
  });

  it('renders the project tags from the handoff inside <span class="tag"> pills', async () => {
    const html = await renderWorkSection();
    // Made by Apes
    expect(html).toMatch(/<span[^>]*>Licensing<\/span>/);
    expect(html).toMatch(/<span[^>]*>On-chain Sync<\/span>/);
    expect(html).toMatch(/<span[^>]*>Auth<\/span>/);
    // Cluster Separation
    expect(html).toMatch(/<span[^>]*>Terraform<\/span>/);
    expect(html).toMatch(/<span[^>]*>EKS<\/span>/);
    expect(html).toMatch(/<span[^>]*>IaC<\/span>/);
    // Incommers NFT
    expect(html).toMatch(/<span[^>]*>Solidity<\/span>/);
    expect(html).toMatch(/<span[^>]*>Merkle Tree<\/span>/);
  });

  it('inlines the made-by-apes signature SVG (4 concentric circles centered at 100,100)', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<svg[^>]*class="signature"/);
    expect(html).toMatch(/cx="100"[^/]*cy="100"[^/]*r="80"/);
    expect(html).toMatch(/cx="100"[^/]*cy="100"[^/]*r="60"/);
    expect(html).toMatch(/cx="100"[^/]*cy="100"[^/]*r="40"/);
    expect(html).toMatch(/cx="100"[^/]*cy="100"[^/]*r="20"/);
  });

  it('renders the side-projects eyebrow (num="04.6") with the bilingual labels', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*>04\.6<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>proyectos personales<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>side projects<\/span>/);
  });

  it('renders both side-project rows (Draguima eSports and Dragora) ordered by `order` asc', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('Draguima eSports');
    expect(html).toContain('Dragora');
    const draguimaIdx = html.indexOf('Draguima eSports');
    const dragoraIdx = html.indexOf('Dragora');
    expect(draguimaIdx).toBeGreaterThan(-1);
    expect(dragoraIdx).toBeGreaterThan(-1);
    expect(draguimaIdx).toBeLessThan(dragoraIdx);
  });

  it('renders the side-project role for both rows', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('Technology Partner &amp; Co-Founder');
    expect(html).toContain('Founder');
  });

  it('renders Dragora as a clickable external link to https://dragora.gg with rel="noopener noreferrer"', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/dragora\.gg"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  it('does NOT wrap the Draguima row in an <a> tag (url is null)', async () => {
    const html = await renderWorkSection();
    // Capture the slice from "Draguima eSports" up to "Dragora" so we can assert on the
    // Draguima row in isolation.
    const draguimaStart = html.indexOf('Draguima eSports');
    expect(draguimaStart).toBeGreaterThan(-1);
    const dragoraStart = html.indexOf('Dragora', draguimaStart + 'Draguima eSports'.length);
    expect(dragoraStart).toBeGreaterThan(-1);
    const draguimaSlice = html.slice(draguimaStart, dragoraStart);
    // The Draguima row must not contain any anchor with a real href (target=_blank gives it away).
    expect(draguimaSlice).not.toMatch(/<a[^>]*target="_blank"/);
  });

  it('does not render the OSS (open source) block in this section (out of scope, feature 25)', async () => {
    const html = await renderWorkSection();
    expect(html).not.toMatch(/<span[^>]*>04\.5<\/span>/);
    expect(html).not.toMatch(/lang="es"[^>]*>open source<\/span>/);
  });

  it('adds the global "reveal" class on the standalone side-block Eyebrow (num="04.6", handoff L647)', async () => {
    const html = await renderWorkSection();
    // The side-block Eyebrow contains a child <span class="num">04.6</span>; locate the
    // outer Eyebrow span by walking back from "04.6" to the nearest enclosing <span class="…">.
    const numIdx = html.search(/<span[^>]*>04\.6<\/span>/);
    expect(numIdx).toBeGreaterThan(-1);
    const before = html.slice(0, numIdx);
    const lastSpanOpenIdx = before.lastIndexOf('<span');
    expect(lastSpanOpenIdx).toBeGreaterThan(-1);
    const eyebrowOpenTag = before.slice(lastSpanOpenIdx);
    const closeTagIdx = eyebrowOpenTag.indexOf('>');
    expect(closeTagIdx).toBeGreaterThan(-1);
    const eyebrowOpenAttrs = eyebrowOpenTag.slice(0, closeTagIdx + 1);
    expect(eyebrowOpenAttrs).toMatch(/class="[^"]*\breveal\b[^"]*"/);
  });
});
