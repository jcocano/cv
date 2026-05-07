import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import HeroSection from '@/components/hero/HeroSection.astro';
import heroJson from '@/data/hero.json';

async function renderHero(lang: 'es' | 'en'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(HeroSection, { props: { lang } });
}

describe('HeroSection (render-test)', () => {
  it('renders the hero name split across two lines with the period as the only "." inside a span', async () => {
    const html = await renderHero('es');
    expect(html).toContain('Jesús');
    expect(html).toContain('Cocaño');
    expect(html).toMatch(/Jesús\s*<br[^>]*>\s*Cocaño/);
    expect(html).toMatch(/<span[^>]*>\.<\/span>/);
  });

  it('emits the eyebrow with the "01 /" numeric prefix and the bilingual labels', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/>01<\/span>\s*\/\s*<span[^>]*lang="es"[^>]*>disponible<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>available<\/span>/);
  });

  it('emits the AI Ready badge with the sparkle SVG and the "AI Ready" text together', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<svg[^>]*class="[^"]*sparkle[^"]*"[\s\S]*?<\/svg>\s*AI Ready/);
  });

  it('emits both Spanish and English pitch blocks with proper lang attributes', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(
      /<span[^>]*lang="es"[^>]*>[^<]*Senior Engineer · Backend, Platform, full-stack cuando se necesita\. Construyendo sistemas distribuidos resilientes, de plataformas blockchain a backends AI-native\./,
    );
    expect(html).toMatch(
      /<span[^>]*lang="en"[^>]*>[^<]*Senior Engineer · Backend, Platform, full-stack when needed\. Building resilient distributed systems, from blockchain platforms to AI-native backends\./,
    );
  });

  it('renders the four meta grid items with their Spanish labels and values', async () => {
    const html = await renderHero('es');
    expect(html).toContain('Ubicación');
    expect(html).toContain('Estado');
    expect(html).toContain('Rol');
    expect(html).toContain('Backend / Platform / SRE');
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

  it('opens GitHub and LinkedIn in a new tab with rel="noopener noreferrer"', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(
      /href="https:\/\/github\.com\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
    expect(html).toMatch(
      /href="https:\/\/linkedin\.com\/in\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  it('renders the LinkedIn link with title="LinkedIn" so the user can identify it', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<a[^>]*href="https:\/\/linkedin\.com\/in\/jcocano"[^>]*title="LinkedIn"/);
  });

  it('renders the avatar img pointing to BASE_URL/pfp.jpeg with the name as alt text', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<img[^>]*src="[^"]*pfp\.jpeg"[^>]*alt="Jesús Cocaño"/);
  });

  it('renders the hero card as <aside aria-label="Profile card"> wrapping the avatar', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<aside[^>]*aria-label="Profile card"[\s\S]*?pfp\.jpeg/);
  });

  it('renders the section root as <header id="top"> with deterministic ASCII content inside an aria-hidden div', async () => {
    const html = await renderHero('es');
    expect(html).toMatch(/<header[^>]*id="top"/);
    const ariaHiddenMatch = html.match(/<div[^>]*aria-hidden="true"[^>]*>([\s\S]*?)<\/div>/);
    expect(ariaHiddenMatch).not.toBeNull();
    if (ariaHiddenMatch === null) {
      throw new Error('expected aria-hidden ASCII container');
    }
    const ascii = ariaHiddenMatch[1] ?? '';
    expect(ascii.length).toBeGreaterThan(100);
    expect(ascii).toContain('▓');
  });
});
