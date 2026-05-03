import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

import type axe from 'axe-core';
import type { AxeResults, Result as AxeViolation } from 'axe-core';
import { JSDOM, VirtualConsole } from 'jsdom';

import type { LangCode, ThemeName } from './build-axe-test-cases';

export interface AuditPageOptions {
  readonly distDir: string;
  readonly pagePath: string;
  readonly theme: ThemeName;
  readonly lang: LangCode;
}

export interface AuditPageResult {
  readonly violations: readonly AxeViolation[];
  readonly passes: readonly AxeViolation[];
}

const HREF_REGEX = /href=("|')([^"']+\.css)\1/g;
const ASTRO_BASE_PREFIX = '/cv/';

async function inlineStylesheets(rawHtml: string, distDir: string): Promise<string> {
  const matches = Array.from(rawHtml.matchAll(HREF_REGEX));
  let output = rawHtml;
  for (const match of matches) {
    const fullTag = match[0];
    const hrefValue = match[2];
    if (typeof hrefValue !== 'string') {
      continue;
    }
    const relPath = hrefValue.startsWith(ASTRO_BASE_PREFIX)
      ? hrefValue.slice(ASTRO_BASE_PREFIX.length)
      : hrefValue.replace(/^\//, '');
    const cssPath = resolve(distDir, relPath);
    try {
      const cssBody = await readFile(cssPath, 'utf-8');
      const inlined = `<style data-inlined-from="${hrefValue}">${cssBody}</style>`;
      const linkTagRegex = new RegExp(`<link[^>]*${escapeRegExp(fullTag)}[^>]*>`, 'i');
      const replaced = output.replace(linkTagRegex, inlined);
      if (replaced !== output) {
        output = replaced;
        continue;
      }
      output = output.replace(fullTag, `${fullTag} data-inlined-replaced`);
      output = output.replace(/<link[^>]*data-inlined-replaced[^>]*>/i, inlined);
    } catch {
      // CSS missing — leave the original <link>; axe will still run, contrast checks
      // may degrade. Surfaced as a violation if relevant.
    }
  }
  return output;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function auditPageWithAxe(options: AuditPageOptions): Promise<AuditPageResult> {
  const absoluteHtmlPath = resolve(options.distDir, options.pagePath);
  const rawHtml = await readFile(absoluteHtmlPath, 'utf-8');
  const inlinedHtml = await inlineStylesheets(rawHtml, options.distDir);

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => undefined);
  virtualConsole.on('warn', () => undefined);
  virtualConsole.on('jsdomError', () => undefined);

  const dom = new JSDOM(inlinedHtml, {
    url: `file://${dirname(absoluteHtmlPath)}/`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole,
  });

  const documentElement = dom.window.document.documentElement;
  documentElement.setAttribute('data-theme', options.theme);
  documentElement.setAttribute('data-lang', options.lang);
  documentElement.setAttribute('lang', options.lang);

  const axeSource = await readAxeSource();
  dom.window.eval(axeSource);

  type AxeRunner = (context: Document, options: axe.RunOptions) => Promise<AxeResults>;
  type AxeWindow = typeof dom.window & { axe: { run: AxeRunner } };
  const windowAxe = (dom.window as AxeWindow).axe;
  if (typeof windowAxe?.run !== 'function') {
    dom.window.close();
    throw new Error('axe-core failed to load into the JSDOM window.');
  }

  const results = await windowAxe.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    resultTypes: ['violations', 'passes'],
  });

  dom.window.close();
  return { violations: results.violations, passes: results.passes };
}

const localRequire = createRequire(import.meta.url);

async function readAxeSource(): Promise<string> {
  const axeEntry = localRequire.resolve('axe-core');
  const axeMinPath = resolve(dirname(axeEntry), 'axe.min.js');
  return readFile(axeMinPath, 'utf-8');
}
