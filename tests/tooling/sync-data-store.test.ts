import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'tooling', 'sync-data-store.mjs');

interface FixtureRepo {
  root: string;
  cacheFile: string;
  targetFile: string;
  cleanup: () => void;
}

function createFixtureRepo(): FixtureRepo {
  const root = mkdtempSync(join(tmpdir(), 'sync-data-store-'));
  const cacheFile = join(root, 'node_modules', '.astro', 'data-store.json');
  const targetFile = join(root, '.astro', 'data-store.json');
  return {
    root,
    cacheFile,
    targetFile,
    cleanup: () => {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function runScriptOnFixture(
  repoRoot: string,
  options: { skipSync?: boolean } = {},
): { status: number | null; stdout: string; stderr: string } {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SYNC_DATA_STORE_REPO_ROOT: repoRoot,
  };
  if (options.skipSync ?? false) {
    env.SYNC_DATA_STORE_SKIP_SYNC = '1';
  }
  const result = spawnSync('node', [SCRIPT_PATH], {
    cwd: repoRoot,
    encoding: 'utf-8',
    env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('tooling/sync-data-store.mjs (unit, fixture repo)', () => {
  let fixture: FixtureRepo | null = null;

  beforeEach(() => {
    fixture = createFixtureRepo();
  });

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  it('exists as an executable Node script in tooling/', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it('creates the target file when it is missing and the cache is present', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    mkdirSync(join(fixture.root, 'node_modules', '.astro'), { recursive: true });
    writeFileSync(fixture.cacheFile, '{"fixture":"v1"}', 'utf-8');
    expect(existsSync(fixture.targetFile)).toBe(false);

    const result = runScriptOnFixture(fixture.root, { skipSync: true });

    expect(result.status).toBe(0);
    expect(existsSync(fixture.targetFile)).toBe(true);
    expect(readFileSync(fixture.targetFile, 'utf-8')).toBe('{"fixture":"v1"}');
  });

  it('produces a target file byte-identical to the cache file', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    mkdirSync(join(fixture.root, 'node_modules', '.astro'), { recursive: true });
    const cacheContents = '{"fixture":"v2","value":42,"nested":{"a":1,"b":2}}';
    writeFileSync(fixture.cacheFile, cacheContents, 'utf-8');

    const result = runScriptOnFixture(fixture.root, { skipSync: true });

    expect(result.status).toBe(0);
    expect(readFileSync(fixture.targetFile, 'utf-8')).toBe(cacheContents);
  });

  it('overwrites a stale target with the freshly copied cache contents', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    mkdirSync(join(fixture.root, 'node_modules', '.astro'), { recursive: true });
    mkdirSync(join(fixture.root, '.astro'), { recursive: true });
    writeFileSync(fixture.targetFile, '{"stale":true}', 'utf-8');
    const staleSize = statSync(fixture.targetFile).size;
    writeFileSync(fixture.cacheFile, '{"fresh":true,"size":"different"}', 'utf-8');

    const result = runScriptOnFixture(fixture.root, { skipSync: true });

    expect(result.status).toBe(0);
    const newContents = readFileSync(fixture.targetFile, 'utf-8');
    expect(newContents).toBe('{"fresh":true,"size":"different"}');
    expect(statSync(fixture.targetFile).size).not.toBe(staleSize);
  });

  it('exits with non-zero status when the cache file is missing after the (skipped) sync', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    expect(existsSync(fixture.cacheFile)).toBe(false);

    const result = runScriptOnFixture(fixture.root, { skipSync: true });

    expect(result.status).not.toBe(0);
    expect(result.status).not.toBe(null);
    expect(result.stderr).toContain('expected cache file');
    expect(existsSync(fixture.targetFile)).toBe(false);
  });

  it('creates the .astro target directory when it does not exist yet', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    mkdirSync(join(fixture.root, 'node_modules', '.astro'), { recursive: true });
    writeFileSync(fixture.cacheFile, '{"fixture":"v3"}', 'utf-8');
    expect(existsSync(join(fixture.root, '.astro'))).toBe(false);

    const result = runScriptOnFixture(fixture.root, { skipSync: true });

    expect(result.status).toBe(0);
    expect(existsSync(join(fixture.root, '.astro'))).toBe(true);
    expect(readFileSync(fixture.targetFile, 'utf-8')).toBe('{"fixture":"v3"}');
  });
});

describe('tooling/sync-data-store.mjs (integration, real repo)', () => {
  it('idempotently keeps .astro/data-store.json byte-identical to the cache file when both exist', () => {
    const cacheFile = join(REPO_ROOT, 'node_modules', '.astro', 'data-store.json');
    const targetFile = join(REPO_ROOT, '.astro', 'data-store.json');
    if (!existsSync(cacheFile)) {
      copyFileSync(targetFile, cacheFile);
    }
    if (!existsSync(targetFile)) {
      copyFileSync(cacheFile, targetFile);
    }
    const targetBefore = readFileSync(targetFile, 'utf-8');
    const cacheBefore = readFileSync(cacheFile, 'utf-8');
    expect(targetBefore).toBe(cacheBefore);

    const result = spawnSync('node', [SCRIPT_PATH], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(existsSync(targetFile)).toBe(true);
    expect(existsSync(cacheFile)).toBe(true);
    expect(readFileSync(targetFile, 'utf-8')).toBe(readFileSync(cacheFile, 'utf-8'));
  });
});
