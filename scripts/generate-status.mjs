#!/usr/bin/env node
// @ts-check
//
// Generates `dist/status.json` after `astro build` finishes. The JSON exposes
// deterministic build + payload metrics consumed by the `<SiteStatus />` block
// of `/design-system/` and reachable directly via `/cv/status.json`. See
// `feature_list.json` #40 for the closed decisions and
// `docs/learnings_dependencia_circular_site_status.md` for the rationale of
// the producer-vs-pipeline separation that this script enforces.
//
// Single output path: the script writes ONE copy at `<distDir>/status.json`.
// The previous iteration also wrote a `.astro/site-status.json` sidecar so the
// `<SiteStatus />` Astro component could read it during SSR — that introduced
// a circular dependency (component depends on the very output the build
// produces) and required a two-pass build to converge. The current
// architecture is producer/pipeline-clean: the component renders an SSR
// skeleton with `aria-busy="true"`, and a tiny client-side module fetches
// `/cv/status.json` at runtime. One pass of `astro build`, no sidecar, no
// chicken-and-egg.
//
// Sequence:
//   1. Resolve overridable inputs (env vars enable hermetic tests).
//   2. Walk `dist/` recursively, totalling sizes per extension and counting
//      `.html` files as `routes_count`.
//   3. Read `schema_version` from the project's `package.json#version`.
//   4. Resolve `build_sha` (default: `git rev-parse HEAD`) and `build_time`
//      (default: `new Date().toISOString()`).
//   5. Validate the payload with `siteStatusSchema` and write it formatted
//      with two-space indentation to `<distDir>/status.json`.
//   6. Fail loudly (exit 1, stderr message containing "site-status") on any
//      validation or filesystem error so the build is treated as broken.
//
// Test hooks (env vars):
//   GENERATE_STATUS_DIST_DIR     — overrides `<repoRoot>/dist`.
//   GENERATE_STATUS_PACKAGE_JSON — overrides `<repoRoot>/package.json`.
//   GENERATE_STATUS_SHA          — overrides `git rev-parse HEAD`. Tests use
//                                  this to inject a fixture sha and avoid
//                                  depending on a real git history.
//   GENERATE_STATUS_BUILD_TIME   — overrides `new Date().toISOString()`.

import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { siteStatusSchema } from '../src/lib/schemas/site-status.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DIST_DIR = process.env.GENERATE_STATUS_DIST_DIR ?? join(REPO_ROOT, 'dist');
const PACKAGE_JSON_PATH =
  process.env.GENERATE_STATUS_PACKAGE_JSON ?? join(REPO_ROOT, 'package.json');

const BYTES_PER_KB = 1024;

/**
 * @typedef {{ pageWeightBytes: number, jsBytes: number, cssBytes: number, routesCount: number }} DistTotals
 */

/**
 * @param {string} dirPath
 * @returns {DistTotals}
 */
function walkDist(dirPath) {
  const totals = { pageWeightBytes: 0, jsBytes: 0, cssBytes: 0, routesCount: 0 };
  /** @type {string[]} */
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch (err) {
      const code = /** @type {NodeJS.ErrnoException} */ (err).code;
      if (code === 'ENOENT') {
        continue;
      }
      throw err;
    }
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const stats = statSync(entryPath);
      const size = stats.size;
      totals.pageWeightBytes += size;
      const ext = extname(entry.name).toLowerCase();
      if (ext === '.js') {
        totals.jsBytes += size;
      } else if (ext === '.css') {
        totals.cssBytes += size;
      } else if (ext === '.html') {
        totals.routesCount += 1;
      }
    }
  }
  return totals;
}

/**
 * @param {number} bytes
 * @returns {number}
 */
function bytesToKb(bytes) {
  return Math.round((bytes / BYTES_PER_KB) * 1000) / 1000;
}

/**
 * @param {string} packageJsonPath
 * @returns {string}
 */
function readSchemaVersion(packageJsonPath) {
  const raw = readFileSync(packageJsonPath, 'utf-8');
  const parsed = /** @type {unknown} */ (JSON.parse(raw));
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    typeof (/** @type {{ version: unknown }} */ (parsed).version) !== 'string'
  ) {
    throw new Error('site-status: package.json must declare a string `version` field');
  }
  return /** @type {{ version: string }} */ (parsed).version;
}

/**
 * @returns {string}
 */
function resolveBuildSha() {
  const override = process.env.GENERATE_STATUS_SHA;
  if (override !== undefined && override !== '') {
    return override;
  }
  const raw = execSync('git rev-parse HEAD', { encoding: 'utf-8' });
  return raw.trim();
}

/**
 * @returns {string}
 */
function resolveBuildTime() {
  const override = process.env.GENERATE_STATUS_BUILD_TIME;
  if (override !== undefined && override !== '') {
    return override;
  }
  return new Date().toISOString();
}

function main() {
  const totals = walkDist(DIST_DIR);
  const schemaVersion = readSchemaVersion(PACKAGE_JSON_PATH);
  const buildSha = resolveBuildSha();
  const buildTime = resolveBuildTime();

  const payload = {
    build_sha: buildSha,
    build_time: buildTime,
    schema_version: schemaVersion,
    page_weight_kb: bytesToKb(totals.pageWeightBytes),
    js_payload_kb: bytesToKb(totals.jsBytes),
    css_payload_kb: bytesToKb(totals.cssBytes),
    routes_count: totals.routesCount,
  };

  const validated = siteStatusSchema.parse(payload);
  const serialized = `${JSON.stringify(validated, null, 2)}\n`;

  const distTargetPath = join(DIST_DIR, 'status.json');
  mkdirSync(dirname(distTargetPath), { recursive: true });
  writeFileSync(distTargetPath, serialized, 'utf-8');
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`site-status: failed to generate dist/status.json — ${message}\n`);
  process.exit(1);
}
