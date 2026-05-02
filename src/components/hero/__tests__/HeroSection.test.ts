import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import HeroSection from '@/components/hero/HeroSection.astro';
import heroJson from '@/data/hero.json';

async function renderHero(lang: 'es' | 'en'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(HeroSection, { props: { lang } });
}

describe('HeroSection (render-test)', () => {
  it('renders the hero name split across two lines with the period in the accent span', async () => {
    const html = await renderHero('es');
    expect(html).toContain('Jesús');
    expect(html).toContain('Cocaño');
    expect(html).toMatch(/<span[^>]*class="[^"]*accent[^"]*"[^>]*>\.<\/span>/);
  });

  it('emits the eyebrow with the "01 /" numeric prefix', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/eyebrow[\s\S]*?01[\s\S]*?\//);
  });

  it('emits the AI Ready badge with the sparkle SVG and the "AI Ready" text', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/class="[^"]*ai-badge[^"]*"/);
    expect(html).toMatch(/class="[^"]*sparkle[^"]*"/);
    expect(html).toContain('AI Ready');
  });

  it('emits both Spanish and English pitch blocks with proper lang attributes', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(
      /<span[^>]*lang="es"[^>]*>[^<]*Senior Fullstack &amp; Platform Engineer construyendo/,
    );
    expect(html).toMatch(
      /<span[^>]*lang="en"[^>]*>[^<]*Senior Fullstack &amp; Platform Engineer building/,
    );
  });

  it('renders the four meta grid items with their labels and values', async () => {
    const html = await renderHero('es');
    const itemMatches = html.match(/class="[^"]*item[^"]*"/g);
    expect(itemMatches).not.toBeNull();
    if (itemMatches === null) {
      throw new Error('expected at least four meta items');
    }
    expect(itemMatches.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain('Ubicación');
    expect(html).toContain('Estado');
    expect(html).toContain('Rol');
    expect(html).toContain('Fullstack / Platform / SRE');
    expect(html).toContain('LLMs · RAG · Agentes · MCP');
  });

  it('renders the English meta labels when lang is "en"', async () => {
    const html = await renderHero('en');
    expect(html).toContain('Location');
    expect(html).toContain('Status');
    expect(html).toContain('Role');
    expect(html).toContain('LLMs · RAG · Agents · MCP');
  });

  it('renders the three contact links with the exact hrefs from the singleton', async () => {
    const html = await renderHero('es');
    expect(html).toContain(`href="${heroJson.links.email}"`);
    expect(html).toContain(`href="${heroJson.links.github}"`);
    expect(html).toContain(`href="${heroJson.links.linkedin}"`);
  });

  it('marks the LinkedIn link with the .full class so it spans two columns', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(
      /<a[^>]*class="[^"]*full[^"]*"[^>]*href="https:\/\/linkedin\.com\/in\/jcocano"/,
    );
  });

  it('opens GitHub and LinkedIn in a new tab with rel="noopener noreferrer"', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(
      /href="https:\/\/github\.com\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
    expect(html).toMatch(
      /href="https:\/\/linkedin\.com\/in\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  it('renders the avatar pointing to BASE_URL/pfp.jpeg and inside a .pfp container', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<div[^>]*class="[^"]*pfp[^"]*"[\s\S]*?<img[^>]*src="[^"]*pfp\.jpeg"/);
    expect(html).toMatch(/<img[^>]*alt="Jesús Cocaño"/);
  });

  it('renders the hero-bg ASCII container with deterministic non-empty content', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/class="[^"]*hero-bg[^"]*"/);
    const heroBgMatch = html.match(/<div[^>]*class="[^"]*hero-bg[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    expect(heroBgMatch).not.toBeNull();
    if (heroBgMatch === null) {
      throw new Error('expected hero-bg container');
    }
    const heroBgInner = heroBgMatch[1] ?? '';
    expect(heroBgInner.length).toBeGreaterThan(100);
    expect(heroBgInner).toContain('▓');
  });

  it('renders the section as <header class="hero" id="top">', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<header[^>]*class="[^"]*hero[^"]*"[^>]*id="top"/);
  });
});
