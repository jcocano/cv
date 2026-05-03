import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..', '..');
const PACKAGE_JSON = join(REPO_ROOT, 'package.json');

interface PackageJsonShape {
  scripts?: Record<string, string>;
}

function readPackageJson(): PackageJsonShape {
  const raw = readFileSync(PACKAGE_JSON, 'utf-8');
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('package.json did not parse to an object');
  }
  return parsed as PackageJsonShape;
}

describe('package.json pretest hook', () => {
  it('defines a `pretest` script that runs the data-store sync tool', () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts;
    expect(scripts).toBeDefined();
    if (scripts === undefined) {
      throw new Error('scripts is undefined');
    }
    expect(scripts.pretest).toBe('node tooling/sync-data-store.mjs');
  });

  it('keeps the `test` script as `vitest run` so the pretest hook actually fires', () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts;
    expect(scripts).toBeDefined();
    if (scripts === undefined) {
      throw new Error('scripts is undefined');
    }
    expect(scripts.test).toBe('vitest run');
  });
});
