#!/usr/bin/env node
// @ts-check
//
// Generates 1200×630 PNG Open Graph thumbnails for every public surface of
// the site. Runs after `astro build` and `npm run build:status` so that
// `dist/` already contains the built site plus the og-preview/* HTML pages
// that this script screenshots.
//
// Sequence:
//   1. Walk `dist/og-preview/<slug>/index.html` to enumerate slugs.
//   2. Spin up a static preview server on a free port serving `dist/` at the
//      same `BASE` (`/cv/`) the rest of the build uses, so the rendered HTML
//      resolves its CSS / fonts the same way it will in production.
//   3. For each slug, navigate Playwright Chromium to
//      `/cv/og-preview/<slug>/` at viewport 1200×630 and screenshot to
//      `dist/og/<slug>.png` (creating subdirectories as needed).
//   4. Tear down the server and exit.
//
// Why Playwright and not satori: the OG card reuses the site's variable
// fonts, CSS custom properties, and oklch() accent colors. Satori only
// supports a subset of CSS and would force a parallel design system. The
// screenshot path keeps "what the site looks like" and "what the OG card
// looks like" exactly aligned with no second source of truth.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, relative, resolve } from 'node:path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const ogPreviewDir = join(distDir, 'og-preview');
const outputDir = join(distDir, 'og');
const BASE_PATH = '/cv/';
const VIEWPORT = { width: 1200, height: 630 };

/**
 * Walk dist/og-preview/ and return every slug that has an index.html.
 * Slugs are relative paths like 'home', 'projects', 'projects/<uuid>'.
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function discoverSlugs(root) {
  /** @type {string[]} */
  const slugs = [];
  /**
   * @param {string} dir
   */
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name === 'index.html') {
        const rel = relative(root, dirname(full));
        if (rel.length > 0) {
          slugs.push(rel.split(/[\\/]/).join('/'));
        }
      }
    }
  }
  await walk(root);
  return slugs.sort();
}

/**
 * Minimal static file server rooted at distDir, serving BASE_PATH/<path>.
 *
 * @param {string} root
 * @param {string} base
 * @returns {Promise<{ url: string; close: () => Promise<void> }>}
 */
async function startStaticServer(root, base) {
  const server = createServer((req, res) => {
    const url = req.url ?? '/';
    if (!url.startsWith(base)) {
      res.statusCode = 404;
      res.end('Not in base path');
      return;
    }
    const stripped = url.slice(base.length).split('?')[0]?.split('#')[0] ?? '';
    const relPath = stripped === '' || stripped.endsWith('/') ? `${stripped}index.html` : stripped;
    const filePath = join(root, relPath);
    readFile(filePath)
      .then((buf) => {
        res.statusCode = 200;
        const ext = /** @type {keyof typeof MIME_TYPES} */ (extname(filePath).toLowerCase());
        res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream');
        res.end(buf);
      })
      .catch(() => {
        res.statusCode = 404;
        res.end(`Not found: ${relPath}`);
      });
  });
  await new Promise((res) => server.listen({ port: 0, host: '127.0.0.1' }, () => res(undefined)));
  const addr = server.address();
  if (addr === null || typeof addr === 'string') {
    throw new Error('Failed to bind preview server');
  }
  const url = `http://127.0.0.1:${addr.port.toString()}${base}`;
  return {
    url,
    close: () =>
      new Promise((res, rej) => {
        server.close((err) => (err ? rej(err) : res()));
      }),
  };
}

async function main() {
  let distExists;
  try {
    distExists = (await stat(ogPreviewDir)).isDirectory();
  } catch {
    distExists = false;
  }
  if (!distExists) {
    console.error(
      `[generate-og] Missing ${ogPreviewDir}. Run 'astro build' first so dist/og-preview/ exists.`,
    );
    process.exit(1);
  }

  const slugs = await discoverSlugs(ogPreviewDir);
  if (slugs.length === 0) {
    console.error('[generate-og] No slugs found under dist/og-preview/.');
    process.exit(1);
  }

  await mkdir(outputDir, { recursive: true });
  const server = await startStaticServer(distDir, BASE_PATH);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    for (const slug of slugs) {
      const page = await context.newPage();
      const url = `${server.url}og-preview/${slug}/`;
      await page.goto(url, { waitUntil: 'networkidle' });
      // eslint-disable-next-line no-undef
      await page.evaluate(() => document.fonts.ready);
      const outPath = join(outputDir, `${slug}.png`);
      await mkdir(dirname(outPath), { recursive: true });
      await page.screenshot({
        path: outPath,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
        type: 'png',
      });
      await page.close();
      console.log(`[generate-og] ${slug} -> ${relative(distDir, outPath)}`);
    }
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`[generate-og] wrote ${slugs.length.toString()} thumbnails to dist/og/`);
}

main().catch((err) => {
  console.error('[generate-og] failed:', err);
  process.exit(1);
});
