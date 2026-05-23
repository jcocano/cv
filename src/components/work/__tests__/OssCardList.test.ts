import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import OssCardList from '@/components/work/OssCardList.astro';

async function renderOssCardList(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(OssCardList);
}

describe('OssCardList (render-test)', () => {
  it('renders exactly four OSS cards from the oss-projects collection', async () => {
    const html = await renderOssCardList();
    const cardMatches = html.match(/class="[^"]*ossCard/g);
    expect(cardMatches).not.toBeNull();
    if (cardMatches === null) {
      throw new Error('expected four oss cards');
    }
    expect(cardMatches).toHaveLength(4);
  });

  it('renders each card as an <a> tag with target="_blank" and rel="noopener noreferrer"', async () => {
    const html = await renderOssCardList();
    const anchorRel = html.match(/<a[^>]*rel="noopener noreferrer"/g);
    expect(anchorRel).not.toBeNull();
    if (anchorRel === null) {
      throw new Error('expected four anchors with rel="noopener noreferrer"');
    }
    expect(anchorRel).toHaveLength(4);
    const targetBlank = html.match(/<a[^>]*target="_blank"/g);
    expect(targetBlank).not.toBeNull();
    if (targetBlank === null) {
      throw new Error('expected four anchors with target="_blank"');
    }
    expect(targetBlank).toHaveLength(4);
  });

  it('points each card href to the correct github.com/<org>/<repo> URL', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/pkmn-vgc-copilot"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/simple-template"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/cli-mailer"/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/github\.com\/jcocano\/Ajolopy"/);
  });

  it('orders the cards by `order` ascending: pkmn-vgc-copilot, simple-template, cli-mailer, Ajolopy', async () => {
    const html = await renderOssCardList();
    const pkmnIdx = html.indexOf('pkmn-vgc-copilot');
    const simpleIdx = html.indexOf('simple-template');
    const cliIdx = html.indexOf('cli-mailer');
    const ajolopyIdx = html.indexOf('Ajolopy');
    expect(pkmnIdx).toBeGreaterThan(-1);
    expect(simpleIdx).toBeGreaterThan(-1);
    expect(cliIdx).toBeGreaterThan(-1);
    expect(ajolopyIdx).toBeGreaterThan(-1);
    expect(pkmnIdx).toBeLessThan(simpleIdx);
    expect(simpleIdx).toBeLessThan(cliIdx);
    expect(cliIdx).toBeLessThan(ajolopyIdx);
  });

  it('renders the org and repo name split into separate spans for every card', async () => {
    const html = await renderOssCardList();
    const orgMatches = html.match(/<span[^>]*>jcocano<\/span>/g);
    expect(orgMatches).not.toBeNull();
    if (orgMatches === null) {
      throw new Error('expected four org spans');
    }
    expect(orgMatches).toHaveLength(4);
    expect(html).toMatch(/<span[^>]*>pkmn-vgc-copilot<\/span>/);
    expect(html).toMatch(/<span[^>]*>simple-template<\/span>/);
    expect(html).toMatch(/<span[^>]*>cli-mailer<\/span>/);
    expect(html).toMatch(/<span[^>]*>Ajolopy<\/span>/);
  });

  it('renders the MIT license badge for every card', async () => {
    const html = await renderOssCardList();
    const licenseMatches = html.match(/>MIT</g);
    expect(licenseMatches).not.toBeNull();
    if (licenseMatches === null) {
      throw new Error('expected four MIT license badges');
    }
    expect(licenseMatches).toHaveLength(4);
  });

  it('renders the bilingual descriptions for all four cards (es and en)', async () => {
    const html = await renderOssCardList();
    expect(html).toContain(
      'Copiloto AI para juego competitivo de Pokémon VGC con RAG híbrido (Postgres + Qdrant): cada respuesta cita su fuente. Pipeline de ingesta con parseo de replays y transcripción Whisper de VODs.',
    );
    expect(html).toContain(
      'AI copilot for competitive Pokémon VGC with hybrid RAG (Postgres + Qdrant): every answer cites its source. Ingestion pipeline with replay parsing and Whisper transcription of VODs.',
    );
    expect(html).toContain(
      'Editor de correos AI-first local (Electron + SQLite) con servidor MCP embebido: agentes AI lo manejan vía 28 tools tipadas. Integra 5 proveedores LLM (Anthropic, OpenAI, Google, Ollama, OpenRouter).',
    );
    expect(html).toContain(
      'AI-first local email editor (Electron + SQLite) with an embedded MCP server: AI agents drive it through 28 typed tools. Integrates 5 LLM providers (Anthropic, OpenAI, Google, Ollama, OpenRouter).',
    );
    expect(html).toContain(
      'CLI mailer para envío de emails a alta escala vía API. Cero dependencias — solo Node y un .env. Soporta SendGrid, Mailgun y APIs custom.',
    );
    expect(html).toContain(
      'Open-source CLI mailer for high-scale email delivery via API. Zero dependencies — just Node and a .env. Works with SendGrid, Mailgun, and custom APIs.',
    );
    expect(html).toContain(
      'Mi framework propio en Python 3.14+ para apps AI-native. LLMs, agentes, tools, prompts, evals, streaming y MCP como primitivos de primera clase. Pyright strict, DI por tipos, asyncio TaskGroup.',
    );
    expect(html).toContain(
      'My own Python 3.14+ framework for AI-native apps. LLMs, agents, tools, prompts, evals, streaming, and MCP as first-class primitives. Pyright strict, DI by type-hints, asyncio TaskGroup.',
    );
  });

  it('renders the bilingual "Repo público" / "Public repo" label inside the top of every card', async () => {
    const html = await renderOssCardList();
    const esLabels = html.match(/<span[^>]*lang="es"[^>]*>Repo público<\/span>/g);
    expect(esLabels).not.toBeNull();
    if (esLabels === null) {
      throw new Error('expected four es labels');
    }
    expect(esLabels).toHaveLength(4);
    const enLabels = html.match(/<span[^>]*lang="en"[^>]*>Public repo<\/span>/g);
    expect(enLabels).not.toBeNull();
    if (enLabels === null) {
      throw new Error('expected four en labels');
    }
    expect(enLabels).toHaveLength(4);
  });

  it('renders TypeScript with the ts swatch modifier for simple-template', async () => {
    const html = await renderOssCardList();
    const typescriptMatches = html.match(/TypeScript/g);
    expect(typescriptMatches).not.toBeNull();
    if (typescriptMatches === null) {
      throw new Error('expected one TypeScript label');
    }
    expect(typescriptMatches).toHaveLength(1);
    const tsSwatchMatches = html.match(/class="[^"]*swatchTs/g);
    expect(tsSwatchMatches).not.toBeNull();
    if (tsSwatchMatches === null) {
      throw new Error('expected one ts swatch');
    }
    expect(tsSwatchMatches).toHaveLength(1);
  });

  it('renders JavaScript with the js swatch modifier for pkmn-vgc-copilot and cli-mailer', async () => {
    const html = await renderOssCardList();
    const javascriptMatches = html.match(/JavaScript/g);
    expect(javascriptMatches).not.toBeNull();
    if (javascriptMatches === null) {
      throw new Error('expected two JavaScript labels');
    }
    expect(javascriptMatches).toHaveLength(2);
    const jsSwatch = html.match(/class="[^"]*swatchJs/g);
    expect(jsSwatch).not.toBeNull();
    if (jsSwatch === null) {
      throw new Error('expected two js swatches');
    }
    expect(jsSwatch).toHaveLength(2);
  });

  it('renders Python with the py swatch modifier for Ajolopy', async () => {
    const html = await renderOssCardList();
    const pythonLangMatches = html.match(/>\s*Python\s*</g);
    expect(pythonLangMatches).not.toBeNull();
    if (pythonLangMatches === null) {
      throw new Error('expected one Python language label');
    }
    expect(pythonLangMatches).toHaveLength(1);
    const pySwatch = html.match(/class="[^"]*swatchPy/g);
    expect(pySwatch).not.toBeNull();
    if (pySwatch === null) {
      throw new Error('expected one py swatch');
    }
    expect(pySwatch).toHaveLength(1);
  });

  it('renders Electron with the electron swatch modifier for simple-template', async () => {
    const html = await renderOssCardList();
    const electronLangMatches = html.match(/>\s*Electron\s*</g);
    expect(electronLangMatches).not.toBeNull();
    if (electronLangMatches === null) {
      throw new Error('expected one Electron language label');
    }
    expect(electronLangMatches).toHaveLength(1);
    const electronSwatch = html.match(/class="[^"]*swatchElectron/g);
    expect(electronSwatch).not.toBeNull();
    if (electronSwatch === null) {
      throw new Error('expected one electron swatch');
    }
    expect(electronSwatch).toHaveLength(1);
  });

  it('renders AI-focused identity labels (AI Copilot, AI-First, AI Framework, AI Agents)', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/>\s*AI Copilot\s*</);
    expect(html).toMatch(/>\s*AI-First\s*</);
    expect(html).toMatch(/>\s*AI Framework\s*</);
    expect(html).toMatch(/>\s*AI Agents\s*</);
  });

  it('renders tech-focused secondary labels across cards (RAG, Qdrant, Postgres, Whisper, MCP, Multi-LLM, React, SQLite, Node.js, SendGrid, Mailgun, LLM, pydantic)', async () => {
    const html = await renderOssCardList();
    expect(html).toMatch(/>\s*RAG\s*</);
    expect(html).toMatch(/>\s*Qdrant\s*</);
    expect(html).toMatch(/>\s*Postgres\s*</);
    expect(html).toMatch(/>\s*Whisper\s*</);
    expect(html).toMatch(/>\s*MCP\s*</);
    expect(html).toMatch(/>\s*Multi-LLM\s*</);
    expect(html).toMatch(/>\s*React\s*</);
    expect(html).toMatch(/>\s*SQLite\s*</);
    expect(html).toMatch(/>\s*Node\.js\s*</);
    expect(html).toMatch(/>\s*SendGrid\s*</);
    expect(html).toMatch(/>\s*Mailgun\s*</);
    expect(html).toMatch(/>\s*LLM\s*</);
    expect(html).toMatch(/>\s*pydantic\s*</);
  });

  it('renders the bilingual "GitHub →" CTA inside every card actions block', async () => {
    const html = await renderOssCardList();
    const ctaMatches = html.match(/GitHub →/g);
    expect(ctaMatches).not.toBeNull();
    if (ctaMatches === null) {
      throw new Error('expected four GitHub CTAs');
    }
    expect(ctaMatches).toHaveLength(4);
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
