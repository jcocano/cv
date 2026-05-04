import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import OssCardList from '@/components/work/OssCardList.astro';

async function renderOssCardList(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(OssCardList);
}

describe('OssCardList (render-test)', () => {
  it('renders exactly three OSS cards from the oss-projects collection', async () => {
    const html = await renderOssCardList();
    const cardMatches = html.match(/class="[^"]*ossCard/g);
    expect(cardMatches).not.toBeNull();
    if (cardMatches === null) {
      throw new Error('expected three oss cards');
    }
    expect(cardMatches).toHaveLength(3);
  });

  it('renders each card as an <a> tag with target="_blank" and rel="noopener noreferrer"', async () => {
    const html = await renderOssCardList();
    const anchorRel = html.match(/<a[^>]*rel="noopener noreferrer"/g);
    expect(anchorRel).not.toBeNull();
    if (anchorRel === null) {
      throw new Error('expected three anchors with rel="noopener noreferrer"');
    }
    expect(anchorRel).toHaveLength(3);
    const targetBlank = html.match(/<a[^>]*target="_blank"/g);
    expect(targetBlank).not.toBeNull();
    if (targetBlank === null) {
      throw new Error('expected three anchors with target="_blank"');
    }
    expect(targetBlank).toHaveLength(3);
  });

  it('points each card href to the correct github.com/<org>/<repo> URL', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/pkmn-vgc-copilot"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/simple-template"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/cli-mailer"/);
  });

  it('orders the cards by `order` ascending: pkmn-vgc-copilot, simple-template, cli-mailer', async () => {
    const html = await renderOssCardList();
    const pkmnIdx = html.indexOf('pkmn-vgc-copilot');
    const simpleIdx = html.indexOf('simple-template');
    const cliIdx = html.indexOf('cli-mailer');
    expect(pkmnIdx).toBeGreaterThan(-1);
    expect(simpleIdx).toBeGreaterThan(-1);
    expect(cliIdx).toBeGreaterThan(-1);
    expect(pkmnIdx).toBeLessThan(simpleIdx);
    expect(simpleIdx).toBeLessThan(cliIdx);
  });

  it('renders the org and repo name split into separate spans for every card', async () => {
    const html = await renderOssCardList();
    const orgMatches = html.match(/<span[^>]*>jcocano<\/span>/g);
    expect(orgMatches).not.toBeNull();
    if (orgMatches === null) {
      throw new Error('expected three org spans');
    }
    expect(orgMatches).toHaveLength(3);
    expect(html).toMatch(/<span[^>]*>pkmn-vgc-copilot<\/span>/);
    expect(html).toMatch(/<span[^>]*>simple-template<\/span>/);
    expect(html).toMatch(/<span[^>]*>cli-mailer<\/span>/);
  });

  it('renders the MIT license badge for every card', async () => {
    const html = await renderOssCardList();
    const licenseMatches = html.match(/>MIT</g);
    expect(licenseMatches).not.toBeNull();
    if (licenseMatches === null) {
      throw new Error('expected three MIT license badges');
    }
    expect(licenseMatches).toHaveLength(3);
  });

  it('renders the bilingual descriptions for all three cards (es and en)', async () => {
    const html = await renderOssCardList();
    expect(html).toContain(
      'Asistente para juego competitivo de Pokémon VGC — análisis de equipos, matchups y decisiones en tiempo real.',
    );
    expect(html).toContain(
      'Companion for competitive Pokémon VGC — team analysis, matchups, and real-time decision support.',
    );
    expect(html).toContain(
      'Diseña plantillas de email espectaculares sin necesidad de saber HTML — pensado para no-técnicos.',
    );
    expect(html).toContain(
      'Design spectacular email templates without needing to know HTML — built for non-technical users.',
    );
    expect(html).toContain(
      'CLI mailer para envío de emails a alta escala vía API. Cero dependencias — solo Node y un .env. Soporta SendGrid, Mailgun y APIs custom.',
    );
    expect(html).toContain(
      'Open-source CLI mailer for high-scale email delivery via API. Zero dependencies — just Node and a .env. Works with SendGrid, Mailgun, and custom APIs.',
    );
  });

  it('renders the bilingual "Repo público" / "Public repo" label inside the top of every card', async () => {
    const html = await renderOssCardList();
    const esLabels = html.match(/<span[^>]*lang="es"[^>]*>Repo público<\/span>/g);
    expect(esLabels).not.toBeNull();
    if (esLabels === null) {
      throw new Error('expected three es labels');
    }
    expect(esLabels).toHaveLength(3);
    const enLabels = html.match(/<span[^>]*lang="en"[^>]*>Public repo<\/span>/g);
    expect(enLabels).not.toBeNull();
    if (enLabels === null) {
      throw new Error('expected three en labels');
    }
    expect(enLabels).toHaveLength(3);
  });

  it('renders TypeScript with the ts swatch modifier for pkmn-vgc-copilot and simple-template', async () => {
    const html = await renderOssCardList();
    const typescriptMatches = html.match(/TypeScript/g);
    expect(typescriptMatches).not.toBeNull();
    if (typescriptMatches === null) {
      throw new Error('expected two TypeScript labels');
    }
    expect(typescriptMatches).toHaveLength(2);
    const tsSwatchMatches = html.match(/class="[^"]*swatchTs/g);
    expect(tsSwatchMatches).not.toBeNull();
    if (tsSwatchMatches === null) {
      throw new Error('expected two ts swatches');
    }
    expect(tsSwatchMatches).toHaveLength(2);
  });

  it('renders JavaScript with the js swatch modifier for cli-mailer', async () => {
    const html = await renderOssCardList();
    const javascriptMatches = html.match(/JavaScript/g);
    expect(javascriptMatches).not.toBeNull();
    if (javascriptMatches === null) {
      throw new Error('expected one JavaScript label');
    }
    expect(javascriptMatches).toHaveLength(1);
    const jsSwatch = html.match(/class="[^"]*swatchJs/g);
    expect(jsSwatch).not.toBeNull();
    if (jsSwatch === null) {
      throw new Error('expected one js swatch');
    }
    expect(jsSwatch).toHaveLength(1);
  });

  it('renders the secondary language labels (VGC, Email, CLI)', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/VGC/);
    expect(html).toMatch(/Email/);
    expect(html).toMatch(/CLI/);
  });

  it('renders the bilingual "GitHub →" CTA inside every card actions block', async () => {
    const html = await renderOssCardList();
    const ctaMatches = html.match(/GitHub →/g);
    expect(ctaMatches).not.toBeNull();
    if (ctaMatches === null) {
      throw new Error('expected three GitHub CTAs');
    }
    expect(ctaMatches).toHaveLength(3);
  });

  it('uses the .ossGrid class wrapper on the root element', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/class="[^"]*ossGrid/);
  });

  it('adds the global "reveal" class on the grid wrapper for the scroll-on-reveal animation', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/class="[^"]*\breveal\b[^"]*"/);
  });
});
