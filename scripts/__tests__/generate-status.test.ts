import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { siteStatusSchema, type SiteStatus } from '@/lib/schemas/site-status';

const REPO_ROOT = join(__dirname, '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'generate-status.mjs');

interface FixtureRepo {
  readonly root: string;
  readonly distDir: string;
  readonly packageJsonPath: string;
  readonly statusJsonPath: string;
  readonly cleanup: () => void;
}

function createFixtureRepo(packageJson: { version: string }): FixtureRepo {
  const root = mkdtempSync(join(tmpdir(), 'generate-status-'));
  const distDir = join(root, 'dist');
  const packageJsonPath = join(root, 'package.json');
  const statusJsonPath = join(distDir, 'status.json');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(packageJsonPath, JSON.stringify(packageJson), 'utf-8');
  return {
    root,
    distDir,
    packageJsonPath,
    statusJsonPath,
    cleanup: () => {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

interface ScriptRunOptions {
  readonly distDir: string;
  readonly packageJsonPath: string;
  readonly buildSha?: string;
  readonly buildTime?: string;
}

interface ScriptRunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function runScript(options: ScriptRunOptions): ScriptRunResult {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GENERATE_STATUS_DIST_DIR: options.distDir,
    GENERATE_STATUS_PACKAGE_JSON: options.packageJsonPath,
    GENERATE_STATUS_SHA: options.buildSha ?? 'abcdef1234567890abcdef1234567890abcdef12',
    GENERATE_STATUS_BUILD_TIME: options.buildTime ?? '2026-05-04T17:00:00.000Z',
  };
  // Make sure GENERATE_STATUS_CACHE_PATH cannot leak from the parent process —
  // the iteration-2 architecture removes the cache copy entirely.
  delete env.GENERATE_STATUS_CACHE_PATH;
  const result = spawnSync('node', [SCRIPT_PATH], {
    encoding: 'utf-8',
    env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function readStatus(statusJsonPath: string): SiteStatus {
  const raw = readFileSync(statusJsonPath, 'utf-8');
  const json: unknown = JSON.parse(raw);
  return siteStatusSchema.parse(json);
}

describe('scripts/generate-status.mjs', () => {
  let fixture: FixtureRepo | null = null;

  beforeEach(() => {
    fixture = createFixtureRepo({ version: '1.0.0' });
  });

  afterEach(() => {
    fixture?.cleanup();
    fixture = null;
  });

  it('writes a status.json that validates against siteStatusSchema', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), '<!doctype html>', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);
    expect(existsSync(fixture.statusJsonPath)).toBe(true);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.schema_version).toBe('1.0.0');
  });

  it('counts only .html files (recursively) as routes_count', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'a'.repeat(1024), 'utf-8');
    mkdirSync(join(fixture.distDir, 'projects'), { recursive: true });
    writeFileSync(join(fixture.distDir, 'projects', 'index.html'), 'b'.repeat(2048), 'utf-8');
    writeFileSync(join(fixture.distDir, 'projects', 'one.html'), 'c'.repeat(512), 'utf-8');
    writeFileSync(join(fixture.distDir, 'app.js'), 'console.log(1)', 'utf-8');
    writeFileSync(join(fixture.distDir, 'styles.css'), '.a{}', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.routes_count).toBe(3);
  });

  it('computes js_payload_kb summing only .js files (recursive)', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'a.js'), 'a'.repeat(2048), 'utf-8');
    mkdirSync(join(fixture.distDir, '_astro'), { recursive: true });
    writeFileSync(join(fixture.distDir, '_astro', 'b.js'), 'b'.repeat(1024), 'utf-8');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.js_payload_kb).toBe(3);
  });

  it('computes css_payload_kb summing only .css files (recursive)', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'a.css'), 'a'.repeat(1024), 'utf-8');
    mkdirSync(join(fixture.distDir, '_astro'), { recursive: true });
    writeFileSync(join(fixture.distDir, '_astro', 'b.css'), 'b'.repeat(2048), 'utf-8');
    writeFileSync(join(fixture.distDir, 'a.js'), 'console.log(1)', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.css_payload_kb).toBe(3);
  });

  it('computes page_weight_kb summing every file in dist/ regardless of extension', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h'.repeat(1024), 'utf-8');
    writeFileSync(join(fixture.distDir, 'app.js'), 'j'.repeat(2048), 'utf-8');
    writeFileSync(join(fixture.distDir, 'styles.css'), 'c'.repeat(1024), 'utf-8');
    writeFileSync(join(fixture.distDir, 'manifest.txt'), 't'.repeat(1024), 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.page_weight_kb).toBe(5);
  });

  it('reports zero routes and zero kb metrics when dist/ is empty', () => {
    if (fixture === null) throw new Error('fixture not initialised');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.routes_count).toBe(0);
    expect(status.page_weight_kb).toBe(0);
    expect(status.js_payload_kb).toBe(0);
    expect(status.css_payload_kb).toBe(0);
  });

  it('reads schema_version from the provided package.json', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(fixture.packageJsonPath, JSON.stringify({ version: '2.7.3' }), 'utf-8');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.schema_version).toBe('2.7.3');
  });

  it('writes the build_sha provided by the override env (truncated 7+ chars allowed)', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
      buildSha: 'fedcba9',
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.build_sha).toBe('fedcba9');
    expect(status.build_sha.length).toBeGreaterThanOrEqual(7);
  });

  it('writes the build_time provided by the override env (ISO 8601)', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
      buildTime: '2026-05-04T18:00:00.000Z',
    });
    expect(result.status).toBe(0);

    const status = readStatus(fixture.statusJsonPath);
    expect(status.build_time).toBe('2026-05-04T18:00:00.000Z');
  });

  it('writes the JSON formatted with two-space indentation', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);

    const raw = readFileSync(fixture.statusJsonPath, 'utf-8');
    expect(raw).toMatch(/\n {2}"build_sha":/);
  });

  it('exits non-zero with a descriptive message when the validated payload would be invalid', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
      buildSha: 'NOT-A-SHA',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr.toLowerCase()).toContain('site-status');
    expect(existsSync(fixture.statusJsonPath)).toBe(false);
  });

  it('exits non-zero when package.json is missing the version field', () => {
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(fixture.packageJsonPath, JSON.stringify({}), 'utf-8');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).not.toBe(0);
  });

  it('writes the status payload only to the single dist/status.json path (no cache sidecar)', () => {
    // Iteration-2 architecture (see docs/learnings_dependencia_circular_site_status.md):
    // the script must NOT write a second copy under .astro/. Any such sidecar would
    // reintroduce the producer/consumer coupling that we explicitly removed.
    //
    // We assert by reading the script source: the iteration-1 implementation hard-coded
    // a fallback to `<repoRoot>/.astro/site-status.json` when GENERATE_STATUS_CACHE_PATH
    // was unset, which would write outside any tmp fixture. Reading the source is the
    // most robust assertion against re-introducing the dual-write anywhere.
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h'.repeat(1024), 'utf-8');

    const result = runScript({
      distDir: fixture.distDir,
      packageJsonPath: fixture.packageJsonPath,
    });
    expect(result.status).toBe(0);
    expect(existsSync(fixture.statusJsonPath)).toBe(true);

    // Strip comments before asserting: the file documents the history of why
    // the sidecar was removed, so prose mentions are intentional. We assert on
    // executable code only.
    const rawSource = readFileSync(SCRIPT_PATH, 'utf-8');
    const scriptCode = rawSource
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    expect(scriptCode).not.toMatch(/GENERATE_STATUS_CACHE_PATH/);
    expect(scriptCode).not.toMatch(/\.astro[\\/]site-status\.json/);
    expect(scriptCode).not.toMatch(/['"`]site-status\.json['"`]/);
  });

  it('ignores GENERATE_STATUS_CACHE_PATH if set in the environment (deprecated env var)', () => {
    // Belt-and-suspenders: even if the env var leaks (CI, dev shell, etc.), the
    // script must not honour it. The single output path is dist/status.json.
    if (fixture === null) throw new Error('fixture not initialised');
    writeFileSync(join(fixture.distDir, 'index.html'), 'h', 'utf-8');
    const ghostCachePath = join(fixture.root, '.astro', 'site-status.json');

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GENERATE_STATUS_DIST_DIR: fixture.distDir,
      GENERATE_STATUS_PACKAGE_JSON: fixture.packageJsonPath,
      GENERATE_STATUS_SHA: 'abcdef1234567890abcdef1234567890abcdef12',
      GENERATE_STATUS_BUILD_TIME: '2026-05-04T17:00:00.000Z',
      GENERATE_STATUS_CACHE_PATH: ghostCachePath,
    };
    const result = spawnSync('node', [SCRIPT_PATH], { encoding: 'utf-8', env });
    expect(result.status).toBe(0);
    expect(existsSync(fixture.statusJsonPath)).toBe(true);
    expect(existsSync(ghostCachePath)).toBe(false);
    expect(existsSync(join(fixture.root, '.astro'))).toBe(false);
  });
});
