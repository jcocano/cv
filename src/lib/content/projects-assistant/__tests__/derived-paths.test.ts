import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  findOrphanBaselines,
  findSlugBranches,
  findVisualTestEntries,
  removeOrphanBaselines,
  removeVisualTestEntries,
  simplifySlugBranches,
} from '@/lib/content/projects-assistant/derived-paths';
import type {
  SlugBranchMatch,
  VisualTestEntry,
} from '@/lib/content/projects-assistant/derived-paths';

const SNAPSHOTS_SPEC_FIXTURE = `import { expect, test } from '@playwright/test';

const PAGES: ReadonlyArray<{ path: string; slug: string }> = [
  { path: '', slug: 'home' },
  { path: 'projects/', slug: 'projects' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },
  { path: 'the-system/', slug: 'the-system' },
];
`;

const AXE_SPEC_FIXTURE = `import { expect, test } from '@playwright/test';

const PAGES: ReadonlyArray<{ path: string; slug: string }> = [
  { path: '', slug: 'home' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },
];
`;

const SIGNATURE_FIXTURE = `---
interface Props {
  slug: string;
}

const { slug } = Astro.props;
---

{
  slug === 'made-by-apes' && (
    <svg class="signature" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="80" />
    </svg>
  )
}
{
  slug === 'cluster-separation' && (
    <svg class="signature" viewBox="0 0 200 200">
      <rect x="20" y="20" width="60" height="60" />
      <rect x="120" y="20" width="60" height="60" />
    </svg>
  )
}
{
  slug !== 'made-by-apes' && slug !== 'cluster-separation' && (
    <svg class="signature" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="80" />
    </svg>
  )
}
`;

interface TempWorkspace {
  readonly root: string;
  readonly snapshotsSpec: string;
  readonly axeSpec: string;
  readonly signatureComponent: string;
  readonly baselineDir: string;
}

async function makeWorkspace(): Promise<TempWorkspace> {
  const root = await mkdtemp(join(tmpdir(), 'derived-paths-test-'));
  const visualDir = join(root, 'tests', 'visual');
  const baselineDir = join(visualDir, '__snapshots__', 'snapshots.spec.ts');
  const componentDir = join(root, 'src', 'components', 'work');
  await mkdir(visualDir, { recursive: true });
  await mkdir(baselineDir, { recursive: true });
  await mkdir(componentDir, { recursive: true });
  const snapshotsSpec = join(visualDir, 'snapshots.spec.ts');
  const axeSpec = join(visualDir, 'axe-contrast.spec.ts');
  const signatureComponent = join(componentDir, 'ProjectSignature.astro');
  await writeFile(snapshotsSpec, SNAPSHOTS_SPEC_FIXTURE, 'utf8');
  await writeFile(axeSpec, AXE_SPEC_FIXTURE, 'utf8');
  await writeFile(signatureComponent, SIGNATURE_FIXTURE, 'utf8');
  return { root, snapshotsSpec, axeSpec, signatureComponent, baselineDir };
}

async function writeBaseline(directory: string, name: string): Promise<string> {
  const filePath = join(directory, name);
  await writeFile(filePath, 'fake-png', 'utf8');
  return filePath;
}

describe('findVisualTestEntries', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('returns the entry for cluster-separation in both spec fixtures', async () => {
    const entries = await findVisualTestEntries('cluster-separation', [
      workspace.snapshotsSpec,
      workspace.axeSpec,
    ]);
    expect(entries).toHaveLength(2);
    const snapshotsHit = entries.find((entry) => entry.filePath === workspace.snapshotsSpec);
    const axeHit = entries.find((entry) => entry.filePath === workspace.axeSpec);
    expect(snapshotsHit).toBeDefined();
    expect(axeHit).toBeDefined();
    if (snapshotsHit === undefined || axeHit === undefined) {
      throw new Error('expected entries in both spec files');
    }
    expect(snapshotsHit.raw).toContain("path: 'projects/cluster-separation/'");
    expect(snapshotsHit.raw).toContain("slug: 'project-cluster-separation'");
    expect(snapshotsHit.lineNumber).toBe(7);
    expect(axeHit.raw).toContain("path: 'projects/cluster-separation/'");
    expect(axeHit.lineNumber).toBe(6);
  });

  it('returns an empty array when the slug does not appear in any spec', async () => {
    const entries = await findVisualTestEntries('nonexistent-slug', [
      workspace.snapshotsSpec,
      workspace.axeSpec,
    ]);
    expect(entries).toHaveLength(0);
  });

  it('skips spec files that do not exist on disk without throwing', async () => {
    const missingSpec = join(workspace.root, 'tests', 'visual', 'does-not-exist.spec.ts');
    const entries = await findVisualTestEntries('cluster-separation', [
      workspace.snapshotsSpec,
      missingSpec,
    ]);
    expect(entries).toHaveLength(1);
    const firstEntry = entries[0];
    expect(firstEntry).toBeDefined();
    if (firstEntry === undefined) {
      throw new Error('expected at least one entry');
    }
    expect(firstEntry.filePath).toBe(workspace.snapshotsSpec);
  });

  it('returns multiple matches when the slug appears more than once in the same file', async () => {
    const duplicateSpec = join(workspace.root, 'tests', 'visual', 'duplicate.spec.ts');
    const duplicateContents =
      `const FIRST_BATCH: ReadonlyArray<{ path: string; slug: string }> = [\n` +
      `  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },\n` +
      `];\n` +
      `const SECOND_BATCH: ReadonlyArray<{ path: string; slug: string }> = [\n` +
      `  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },\n` +
      `];\n`;
    await writeFile(duplicateSpec, duplicateContents, 'utf8');
    const entries = await findVisualTestEntries('cluster-separation', [duplicateSpec]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.lineNumber).toBe(2);
    expect(entries[1]?.lineNumber).toBe(5);
  });
});

describe('removeVisualTestEntries', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('removes the matched lines from each spec and reports applied=true', async () => {
    const entries = await findVisualTestEntries('cluster-separation', [
      workspace.snapshotsSpec,
      workspace.axeSpec,
    ]);
    const results = await removeVisualTestEntries(entries);
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.applied).toBe(true);
      expect(result.error).toBeUndefined();
    }
    const snapshotsAfter = await readFile(workspace.snapshotsSpec, 'utf8');
    const axeAfter = await readFile(workspace.axeSpec, 'utf8');
    expect(snapshotsAfter).not.toContain('cluster-separation');
    expect(axeAfter).not.toContain('cluster-separation');
    expect(snapshotsAfter).toContain('project-made-by-apes');
    expect(axeAfter).toContain('project-made-by-apes');
  });

  it('is idempotent: a second call reports applied=false without error', async () => {
    const firstEntries = await findVisualTestEntries('cluster-separation', [
      workspace.snapshotsSpec,
    ]);
    await removeVisualTestEntries(firstEntries);
    const secondResults = await removeVisualTestEntries(firstEntries);
    expect(secondResults).toHaveLength(1);
    const firstResult = secondResults[0];
    expect(firstResult).toBeDefined();
    if (firstResult === undefined) {
      throw new Error('expected one removal result');
    }
    expect(firstResult.applied).toBe(false);
    expect(firstResult.error).toBeUndefined();
  });

  it('preserves the line order of remaining entries after removal', async () => {
    const entries = await findVisualTestEntries('cluster-separation', [workspace.snapshotsSpec]);
    await removeVisualTestEntries(entries);
    const snapshotsAfter = await readFile(workspace.snapshotsSpec, 'utf8');
    const linesAfter = snapshotsAfter.split('\n');
    const homeIndex = linesAfter.findIndex((line) => line.includes("slug: 'home'"));
    const projectsIndex = linesAfter.findIndex((line) => line.includes("slug: 'projects'"));
    const madeIndex = linesAfter.findIndex((line) => line.includes('project-made-by-apes'));
    const systemIndex = linesAfter.findIndex((line) => line.includes("slug: 'the-system'"));
    expect(homeIndex).toBeGreaterThan(-1);
    expect(projectsIndex).toBeGreaterThan(homeIndex);
    expect(madeIndex).toBeGreaterThan(projectsIndex);
    expect(systemIndex).toBeGreaterThan(madeIndex);
  });
});

describe('findOrphanBaselines', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('returns the 6 expected baseline paths when all exist on disk', async () => {
    const expectedNames = [
      'project-cluster-separation-dark-en.png',
      'project-cluster-separation-dark-es.png',
      'project-cluster-separation-light-en.png',
      'project-cluster-separation-light-es.png',
      'project-cluster-separation-paper-en.png',
      'project-cluster-separation-paper-es.png',
    ];
    const expectedPaths: string[] = [];
    for (const name of expectedNames) {
      expectedPaths.push(await writeBaseline(workspace.baselineDir, name));
    }
    const found = await findOrphanBaselines('cluster-separation', workspace.baselineDir);
    expect(found).toHaveLength(6);
    expect([...found].sort()).toEqual([...expectedPaths].sort());
  });

  it('returns an empty array when no baselines exist for the slug', async () => {
    const found = await findOrphanBaselines('cluster-separation', workspace.baselineDir);
    expect(found).toHaveLength(0);
  });

  it('returns only the baselines that exist when the set is partial', async () => {
    const onlyOne = await writeBaseline(
      workspace.baselineDir,
      'project-cluster-separation-dark-en.png',
    );
    const found = await findOrphanBaselines('cluster-separation', workspace.baselineDir);
    expect(found).toHaveLength(1);
    expect(found[0]).toBe(onlyOne);
  });

  it('returns an empty array when the baseline directory does not exist', async () => {
    const missingDir = join(workspace.root, 'tests', 'visual', '__snapshots__', 'missing');
    const found = await findOrphanBaselines('cluster-separation', missingDir);
    expect(found).toHaveLength(0);
  });
});

describe('removeOrphanBaselines', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('unlinks every file in the input and reports applied=true', async () => {
    const baseline = await writeBaseline(
      workspace.baselineDir,
      'project-cluster-separation-dark-en.png',
    );
    const results = await removeOrphanBaselines([baseline]);
    expect(results).toHaveLength(1);
    const firstResult = results[0];
    expect(firstResult).toBeDefined();
    if (firstResult === undefined) {
      throw new Error('expected one removal result');
    }
    expect(firstResult.applied).toBe(true);
    expect(firstResult.error).toBeUndefined();
    const exists = await readFile(baseline, 'utf8').then(
      () => true,
      () => false,
    );
    expect(exists).toBe(false);
  });

  it('is idempotent: a missing file reports applied=false without error', async () => {
    const ghostPath = join(workspace.baselineDir, 'project-cluster-separation-dark-en.png');
    const results = await removeOrphanBaselines([ghostPath]);
    expect(results).toHaveLength(1);
    const firstResult = results[0];
    expect(firstResult).toBeDefined();
    if (firstResult === undefined) {
      throw new Error('expected one removal result');
    }
    expect(firstResult.applied).toBe(false);
    expect(firstResult.error).toBeUndefined();
  });
});

describe('findSlugBranches', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('detects the positive branch and the negative guard for cluster-separation in the signature component', async () => {
    const matches = await findSlugBranches('cluster-separation', [workspace.signatureComponent]);
    expect(matches).toHaveLength(2);
    const positiveBranch = matches.find((match) => match.kind === 'positive-branch');
    const negativeGuard = matches.find((match) => match.kind === 'negative-guard');
    expect(positiveBranch).toBeDefined();
    expect(negativeGuard).toBeDefined();
    if (positiveBranch === undefined || negativeGuard === undefined) {
      throw new Error('expected positive-branch and negative-guard matches');
    }
    expect(positiveBranch.filePath).toBe(workspace.signatureComponent);
    expect(positiveBranch.snippet).toContain("slug === 'cluster-separation'");
    expect(positiveBranch.snippet).toContain('<rect');
    expect(negativeGuard.snippet).toContain("slug !== 'cluster-separation'");
  });

  it('returns an empty array when the slug does not appear in any candidate', async () => {
    const matches = await findSlugBranches('ghost-slug', [workspace.signatureComponent]);
    expect(matches).toHaveLength(0);
  });

  it('skips candidate files that do not exist on disk without throwing', async () => {
    const ghostFile = join(workspace.root, 'src', 'components', 'work', 'Ghost.astro');
    const matches = await findSlugBranches('cluster-separation', [
      workspace.signatureComponent,
      ghostFile,
    ]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    for (const match of matches) {
      expect(match.filePath).toBe(workspace.signatureComponent);
    }
  });

  it('marks an arbitrary string literal mention as literal-reference', async () => {
    const literalFile = join(workspace.root, 'src', 'components', 'work', 'Literal.astro');
    await writeFile(
      literalFile,
      `---
const note = 'cluster-separation is the legacy slug';
---
<p>literal</p>
`,
      'utf8',
    );
    const matches = await findSlugBranches('cluster-separation', [literalFile]);
    expect(matches).toHaveLength(1);
    const firstMatch = matches[0];
    expect(firstMatch).toBeDefined();
    if (firstMatch === undefined) {
      throw new Error('expected one literal-reference match');
    }
    expect(firstMatch.kind).toBe('literal-reference');
  });
});

describe('simplifySlugBranches', () => {
  let workspace: TempWorkspace;

  beforeEach(async () => {
    workspace = await makeWorkspace();
  });

  afterEach(async () => {
    await rm(workspace.root, { recursive: true, force: true });
  });

  it('removes the positive branch block and the negative guard clause for cluster-separation', async () => {
    const matches = await findSlugBranches('cluster-separation', [workspace.signatureComponent]);
    const results = await simplifySlugBranches(matches);
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.applied).toBe(true);
      expect(result.error).toBeUndefined();
    }
    const after = await readFile(workspace.signatureComponent, 'utf8');
    expect(after).not.toContain("slug === 'cluster-separation'");
    expect(after).not.toContain("slug !== 'cluster-separation'");
    expect(after).toContain("slug === 'made-by-apes'");
    expect(after).toContain("slug !== 'made-by-apes'");
  });

  it('returns applied=false with an error when the match kind is literal-reference', async () => {
    const literalFile = join(workspace.root, 'src', 'components', 'work', 'Literal.astro');
    await writeFile(
      literalFile,
      `---
const note = 'cluster-separation is the legacy slug';
---
<p>literal</p>
`,
      'utf8',
    );
    const matches = await findSlugBranches('cluster-separation', [literalFile]);
    const results = await simplifySlugBranches(matches);
    expect(results).toHaveLength(1);
    const firstResult = results[0];
    expect(firstResult).toBeDefined();
    if (firstResult === undefined) {
      throw new Error('expected one result');
    }
    expect(firstResult.applied).toBe(false);
    expect(firstResult.error).toBeDefined();
    if (firstResult.error === undefined) {
      throw new Error('expected an error for literal-reference');
    }
    expect(firstResult.error).toContain('literal-reference');
    const after = await readFile(literalFile, 'utf8');
    expect(after).toContain('cluster-separation is the legacy slug');
  });

  it('is idempotent when run twice: the second run reports applied=false without error', async () => {
    const firstMatches = await findSlugBranches('cluster-separation', [
      workspace.signatureComponent,
    ]);
    await simplifySlugBranches(firstMatches);
    const secondResults = await simplifySlugBranches(firstMatches);
    expect(secondResults).toHaveLength(2);
    for (const result of secondResults) {
      expect(result.applied).toBe(false);
      expect(result.error).toBeUndefined();
    }
  });
});

describe('derived-paths types are exported', () => {
  it('exports VisualTestEntry and SlugBranchMatch types usable in narrowing', () => {
    const entry: VisualTestEntry = { filePath: '/x', lineNumber: 1, raw: 'raw' };
    const match: SlugBranchMatch = {
      filePath: '/x',
      lineStart: 1,
      lineEnd: 2,
      kind: 'positive-branch',
      snippet: 'snippet',
      targetSlug: 'cluster-separation',
    };
    expect(entry.filePath).toBe('/x');
    expect(match.kind).toBe('positive-branch');
    expect(match.targetSlug).toBe('cluster-separation');
  });
});

describe('findVisualTestEntries default targets', () => {
  it('uses repo-relative tests/visual specs as default when no targets are passed', async () => {
    const repoRoot = resolve(__dirname, '../../../../../');
    const entries = await findVisualTestEntries('made-by-apes');
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const filePaths = new Set(entries.map((entry) => entry.filePath));
    expect(filePaths.has(join(repoRoot, 'tests/visual/snapshots.spec.ts'))).toBe(true);
    expect(filePaths.has(join(repoRoot, 'tests/visual/axe-contrast.spec.ts'))).toBe(true);
  });
});
