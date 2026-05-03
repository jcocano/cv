#!/usr/bin/env node
// @ts-check
//
// Regenerates `.astro/data-store.json` so vitest can run `getCollection(...)`
// hermetically. See `docs/verification.md` §5 for the full rationale.
//
// Why this script exists: in Astro 6.2.1, `astro sync` writes the data-store
// to the location returned by `getDataStoreFile(settings, isDev)` — which
// resolves to `settings.config.cacheDir` (= `node_modules/.astro/`) when
// `isDev=false` and to `settings.dotAstroDir` (= `.astro/`) only when
// `isDev=true`. Vitest does not run the dev server, so it consumes the file
// from `.astro/data-store.json` (the dotAstroDir resolution path used by the
// `vite-plugin-content-virtual-mod` when `env.command === 'serve'`). The
// fixture left in `.astro/` after the last `astro dev` run can quickly become
// stale relative to actual content; this script forces a fresh copy.
//
// Sequence:
//   1. Run `npx astro sync` — refreshes `node_modules/.astro/data-store.json`.
//   2. Copy that file over `.astro/data-store.json`, creating `.astro/` if
//      needed.
//   3. Fail loudly if either step does not produce the expected file, so the
//      `pretest` hook stops vitest before running tests against stale data.
//
// Test hooks (env vars):
//   SYNC_DATA_STORE_REPO_ROOT   — overrides the repo root used to resolve
//                                 paths and to set cwd of `astro sync`. Tests
//                                 use a fixture repo so they don't race with
//                                 the real data-store file.
//   SYNC_DATA_STORE_SKIP_SYNC=1 — skip the `astro sync` invocation. Tests use
//                                 this to seed a fixture cache file by hand
//                                 and exercise only the copy step.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(
  process.env.SYNC_DATA_STORE_REPO_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..'),
);
const CACHE_FILE = join(REPO_ROOT, 'node_modules', '.astro', 'data-store.json');
const TARGET_FILE = join(REPO_ROOT, '.astro', 'data-store.json');

function runAstroSync() {
  if (process.env.SYNC_DATA_STORE_SKIP_SYNC === '1') {
    return;
  }
  const result = spawnSync('npx', ['--no-install', 'astro', 'sync'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: false,
  });
  if (typeof result.status !== 'number' || result.status !== 0) {
    console.error(
      `[sync-data-store] \`npx astro sync\` exited with status ${String(result.status)}`,
    );
    process.exit(typeof result.status === 'number' ? result.status : 1);
  }
}

function copyCacheToTarget() {
  if (!existsSync(CACHE_FILE)) {
    console.error(
      `[sync-data-store] expected cache file at ${CACHE_FILE} after \`astro sync\` ` +
        'but it is missing. Astro may have changed how it persists the data-store.',
    );
    process.exit(1);
  }
  mkdirSync(dirname(TARGET_FILE), { recursive: true });
  copyFileSync(CACHE_FILE, TARGET_FILE);
  if (!existsSync(TARGET_FILE)) {
    console.error(`[sync-data-store] failed to write target file at ${TARGET_FILE}`);
    process.exit(1);
  }
}

runAstroSync();
copyCacheToTarget();
