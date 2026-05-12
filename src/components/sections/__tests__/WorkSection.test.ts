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

  it('renders the bilingual h2 title with both Spanish and English versions', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Trabajo[\s\S]*seleccionado\.<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Selected[\s\S]*projects\.<\/span>/);
  });

  it('renders the bilingual lede paragraph from the handoff', async () => {
    const html = await renderWorkSection();
    expect(html).toContain(
      'Plataformas en producción, decisiones de arquitectura, e impacto medible.',
    );
    expect(html).toContain('Production platforms, architectural calls, and measurable impact.');
  });

  it('renders the case-studies block with the featured project (On-Chain Licensing Platform)', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('On-Chain Licensing Platform');
    expect(html).not.toContain('Incommers NFT');
    expect(html).not.toContain('Cluster Separation');
  });

  it('renders the 04.5 eyebrow with bilingual "open source" labels', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/>04\.5</);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>open source<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>open source<\/span>/);
  });

  it('renders the 04.6 eyebrow with bilingual "proyectos personales / side projects" labels', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/>04\.6</);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>proyectos personales<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>side projects<\/span>/);
  });

  it('renders the OSS card list with all three OSS entries', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('cli-mailer');
    expect(html).toContain('simple-template');
    expect(html).toContain('pkmn-vgc-copilot');
  });

  it('renders the side-project rows with both side projects', async () => {
    const html = await renderWorkSection();
    expect(html).toContain('Dragora');
    expect(html).toContain('Draguima');
  });

  it('renders the discrete MoreProjectsLink between case studies and the OSS block with bilingual copy', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Más proyectos de interés →<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>More projects of interest →<\/span>/);
  });

  it('the MoreProjectsLink anchor points to /projects/', async () => {
    const html = await renderWorkSection();
    expect(html).toMatch(/<a[^>]*href="[^"]*projects\/"/);
  });

  it('places the MoreProjectsLink AFTER the case-studies block and BEFORE the 04.5 OSS eyebrow', async () => {
    const html = await renderWorkSection();
    const caseStudiesIdx = html.lastIndexOf('On-Chain Licensing Platform');
    const linkIdx = html.indexOf('Más proyectos de interés');
    const ossEyebrowIdx = html.indexOf('>04.5<');
    expect(caseStudiesIdx).toBeGreaterThan(-1);
    expect(linkIdx).toBeGreaterThan(-1);
    expect(ossEyebrowIdx).toBeGreaterThan(-1);
    expect(caseStudiesIdx).toBeLessThan(linkIdx);
    expect(linkIdx).toBeLessThan(ossEyebrowIdx);
  });

  it('places the MoreProjectsLink BEFORE the side-projects block', async () => {
    const html = await renderWorkSection();
    const linkIdx = html.indexOf('Más proyectos de interés');
    const sideIdx = html.lastIndexOf('Draguima');
    expect(linkIdx).toBeGreaterThan(-1);
    expect(sideIdx).toBeGreaterThan(-1);
    expect(linkIdx).toBeLessThan(sideIdx);
  });

  it('does NOT render the deprecated 04.1 "more projects" eyebrow anymore', async () => {
    const html = await renderWorkSection();
    expect(html).not.toMatch(/>04\.1</);
  });

  it('does NOT include any MoreProjectRow markup (no kind data attribute)', async () => {
    const html = await renderWorkSection();
    expect(html).not.toMatch(/data-kind="/);
  });
});
