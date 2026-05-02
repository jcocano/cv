import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import AiReadySection from '@/components/sections/AiReadySection.astro';

async function renderAiReady(lang: 'es' | 'en'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(AiReadySection, { props: { lang } });
}

describe('AiReadySection (render-test)', () => {
  it('renders the section root as <section id="ai">', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<section[^>]*id="ai"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<section[^>]*id="ai"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead eyebrow with the ✦ symbol and the bilingual "AI Ready" labels', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<span[^>]*>✦<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>AI Ready<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>AI Ready<\/span>/);
  });

  it('renders the bilingual h2 title from ai-ready.json (split by \\n into <br/> lines)', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<h2[^>]*>[\s\S]*AI-native[\s\S]*por defecto\.[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*AI-native[\s\S]*by default\.[\s\S]*<\/h2>/);
  });

  it('renders the bilingual lede paragraph from ai-ready.json', async () => {
    const html = await renderAiReady('es');
    expect(html).toContain('Aplicando IA en mi flujo diario');
    expect(html).toContain('Using AI in my daily workflow');
  });

  it('renders three card titles in both languages (h4 elements)', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Desarrollo asistido<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>AI-assisted dev<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Backends para LLMs<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>LLM backends<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Agentes y MCP<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Agents (?:&|&amp;) MCP<\/span>/);
  });

  it('renders three h4 elements (one per card)', async () => {
    const html = await renderAiReady('es');
    const h4Matches = html.match(/<h4[^>]*>/g);
    expect(h4Matches).not.toBeNull();
    if (h4Matches === null) {
      throw new Error('expected three h4 elements');
    }
    expect(h4Matches).toHaveLength(3);
  });

  it('renders unique body fragments for each card in both languages', async () => {
    const html = await renderAiReady('es');
    expect(html).toContain('Claude Code, Cursor y Copilot');
    expect(html).toContain('Claude Code, Cursor, and Copilot');
    expect(html).toContain('streaming, function calling, RAG');
    expect(html).toContain('agentes con tools, memory');
    expect(html).toContain('agents with tools, memory');
    expect(html).toContain('Servidores MCP');
    expect(html).toContain('MCP servers');
  });

  it('renders the three SVG icons inside the cards (one per card via iconKey mapping)', async () => {
    const html = await renderAiReady('es');
    const svgMatches = html.match(/<svg[^>]*viewBox="0 0 24 24"/g) ?? [];
    expect(svgMatches.length).toBeGreaterThanOrEqual(3);
  });

  it('renders all tags from each card as <span> Tag primitives', async () => {
    const html = await renderAiReady('es');
    expect(html).toMatch(/<span[^>]*>Claude Code<\/span>/);
    expect(html).toMatch(/<span[^>]*>Cursor<\/span>/);
    expect(html).toMatch(/<span[^>]*>Copilot<\/span>/);
    expect(html).toMatch(/<span[^>]*>RAG<\/span>/);
    expect(html).toMatch(/<span[^>]*>Vector DBs<\/span>/);
    expect(html).toMatch(/<span[^>]*>Streaming<\/span>/);
    expect(html).toMatch(/<span[^>]*>Function calling<\/span>/);
    expect(html).toMatch(/<span[^>]*>MCP<\/span>/);
    expect(html).toMatch(/<span[^>]*>Agents<\/span>/);
    expect(html).toMatch(/<span[^>]*>Tool use<\/span>/);
    expect(html).toMatch(/<span[^>]*>Orchestration<\/span>/);
  });

  it('renders the bilingual "my take" paragraph with the → arrow', async () => {
    const html = await renderAiReady('es');
    expect(html).toContain('→');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Mi enfoque:[\s\S]*<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>My take:[\s\S]*<\/span>/);
  });

  it('renders identical HTML regardless of the lang prop (content is fully bilingual)', async () => {
    const htmlEs = await renderAiReady('es');
    const htmlEn = await renderAiReady('en');
    expect(htmlEs).toBe(htmlEn);
  });
});
