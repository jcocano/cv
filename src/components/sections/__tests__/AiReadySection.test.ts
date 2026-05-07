import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import AiReadySection from '@/components/sections/AiReadySection.astro';
import aiReadyStyles from '@/components/sections/AiReadySection.module.css';

async function renderAiReady(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(AiReadySection);
}

describe('AiReadySection (render-test)', () => {
  it('renders the section root as <section id="ai">', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<section[^>]*id="ai"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<section[^>]*id="ai"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the SectionHead eyebrow with the ✦ symbol and the bilingual "AI Ready" labels', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<span[^>]*>✦<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>AI Ready<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>AI Ready<\/span>/);
  });

  it('renders the bilingual h2 title from ai-ready.json (split by \\n into <br/> lines)', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*AI-native[\s\S]*por defecto\.[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*AI-native[\s\S]*by default\.[\s\S]*<\/h2>/);
  });

  it('renders the bilingual lede paragraph from ai-ready.json', async () => {
    const html = await renderAiReady();
    expect(html).toContain('Dos años usando IA');
    expect(html).toContain('Two years using AI');
  });

  it('renders four card titles in both languages (h4 elements)', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Desarrollo asistido<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>AI-assisted dev<\/span>/);
    expect(html).toMatch(
      /<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>RAG con citación estricta<\/span>/,
    );
    expect(html).toMatch(
      /<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>RAG with strict citation<\/span>/,
    );
    expect(html).toMatch(
      /<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Multi-provider y modelos locales<\/span>/,
    );
    expect(html).toMatch(
      /<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Multi-provider (?:&|&amp;) local models<\/span>/,
    );
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Agentes y MCP<\/span>/);
    expect(html).toMatch(/<h4[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Agents (?:&|&amp;) MCP<\/span>/);
  });

  it('renders four h4 elements (one per card)', async () => {
    const html = await renderAiReady();
    const h4Matches = html.match(/<h4[^>]*>/g);
    expect(h4Matches).not.toBeNull();
    if (h4Matches === null) {
      throw new Error('expected four h4 elements');
    }
    expect(h4Matches).toHaveLength(4);
  });

  it('renders unique body fragments for each card in both languages', async () => {
    const html = await renderAiReady();
    expect(html).toContain('Claude Code, Cursor, OpenCode y Codex CLI');
    expect(html).toContain('Claude Code, Cursor, OpenCode, and Codex CLI');
    expect(html).toContain('recuperación híbrida');
    expect(html).toContain('hybrid retrieval');
    expect(html).toContain('Multi-provider en producción real');
    expect(html).toContain('Multi-provider in real production');
    expect(html).toContain('Servidores MCP desplegados');
    expect(html).toContain('MCP servers deployed');
  });

  it('renders the four SVG icons inside the cards (one per card via iconKey mapping)', async () => {
    const html = await renderAiReady();
    const svgMatches = html.match(/<svg[^>]*viewBox="0 0 24 24"/g) ?? [];
    expect(svgMatches.length).toBeGreaterThanOrEqual(4);
  });

  it('renders all tags from each card as <span> Tag primitives', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<span[^>]*>Claude Code<\/span>/);
    expect(html).toMatch(/<span[^>]*>Cursor<\/span>/);
    expect(html).toMatch(/<span[^>]*>OpenCode<\/span>/);
    expect(html).toMatch(/<span[^>]*>Codex CLI<\/span>/);
    expect(html).toMatch(/<span[^>]*>RAG<\/span>/);
    expect(html).toMatch(/<span[^>]*>Hybrid retrieval<\/span>/);
    expect(html).toMatch(/<span[^>]*>Vector DBs \(Qdrant\)<\/span>/);
    expect(html).toMatch(/<span[^>]*>Citation discipline<\/span>/);
    expect(html).toMatch(/<span[^>]*>Multi-provider<\/span>/);
    expect(html).toMatch(/<span[^>]*>OpenRouter<\/span>/);
    expect(html).toMatch(/<span[^>]*>Local LLMs<\/span>/);
    expect(html).toMatch(/<span[^>]*>Ollama \/ LM Studio<\/span>/);
    expect(html).toMatch(/<span[^>]*>MCP<\/span>/);
    expect(html).toMatch(/<span[^>]*>Agents<\/span>/);
    expect(html).toMatch(/<span[^>]*>Tool use<\/span>/);
    expect(html).toMatch(/<span[^>]*>Zod-typed contracts<\/span>/);
  });

  it('renders the bilingual "my take" paragraph with the → arrow', async () => {
    const html = await renderAiReady();
    expect(html).toContain('→');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Para mí[\s\S]*<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>For me[\s\S]*<\/span>/);
  });

  it('adds the global "reveal" class on the SectionHead wrapper (handoff L151)', async () => {
    const html = await renderAiReady();
    expect(html).toMatch(/<div\b[^>]*class="[^"]*\breveal\b[^"]*"[^>]*>\s*<span/);
  });

  it('adds the global "reveal" class on the .ai-grid container (handoff L165)', async () => {
    const html = await renderAiReady();
    const aiGridClassName = aiReadyStyles.aiGrid;
    if (aiGridClassName === undefined) {
      throw new Error('aiReadyStyles.aiGrid must be defined');
    }
    const divMatches = html.match(/<div\b[^>]*>/g) ?? [];
    const aiGridHit = divMatches.find(
      (tag) => tag.includes(aiGridClassName) && /\breveal\b/.test(tag),
    );
    expect(aiGridHit).toBeDefined();
  });

  it('adds the global "reveal" class on the .my-take final paragraph (handoff L207)', async () => {
    const html = await renderAiReady();
    const myTakeClassName = aiReadyStyles.myTake;
    if (myTakeClassName === undefined) {
      throw new Error('aiReadyStyles.myTake must be defined');
    }
    const pMatches = html.match(/<p\b[^>]*>/g) ?? [];
    const myTakeHit = pMatches.find(
      (tag) => tag.includes(myTakeClassName) && /\breveal\b/.test(tag),
    );
    expect(myTakeHit).toBeDefined();
  });
});
