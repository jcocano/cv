import { readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export interface VisualTestEntry {
  readonly filePath: string;
  readonly lineNumber: number;
  readonly raw: string;
}

export type SlugBranchKind = 'positive-branch' | 'negative-guard' | 'literal-reference';

export interface SlugBranchMatch {
  readonly filePath: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly kind: SlugBranchKind;
  readonly snippet: string;
  readonly targetSlug: string;
}

export interface RemovalResult {
  readonly filePath: string;
  readonly applied: boolean;
  readonly error?: string;
}

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../../../');

const DEFAULT_VISUAL_SPECS: readonly string[] = [
  resolve(REPO_ROOT, 'tests/visual/snapshots.spec.ts'),
  resolve(REPO_ROOT, 'tests/visual/axe-contrast.spec.ts'),
];

const DEFAULT_BASELINE_DIR = resolve(REPO_ROOT, 'tests/visual/__snapshots__/snapshots.spec.ts');

const DEFAULT_SLUG_BRANCH_TARGETS: readonly string[] = [
  resolve(REPO_ROOT, 'src/components/work/ProjectSignature.astro'),
];

const THEMES: readonly string[] = ['dark', 'light', 'paper'];
const LANGS: readonly string[] = ['en', 'es'];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function findSlugLineMatches(content: string, slug: string): readonly VisualTestEntry[] {
  const matches: VisualTestEntry[] = [];
  const lines = content.split('\n');
  const targetFragment = `'projects/${slug}/'`;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }
    if (line.includes(targetFragment)) {
      matches.push({
        filePath: '',
        lineNumber: index + 1,
        raw: line,
      });
    }
  }
  return matches;
}

export async function findVisualTestEntries(
  slug: string,
  specPaths: readonly string[] = DEFAULT_VISUAL_SPECS,
): Promise<readonly VisualTestEntry[]> {
  const collected: VisualTestEntry[] = [];
  for (const specPath of specPaths) {
    if (!(await fileExists(specPath))) {
      continue;
    }
    const content = await readFile(specPath, 'utf8');
    const lineMatches = findSlugLineMatches(content, slug);
    for (const lineMatch of lineMatches) {
      collected.push({
        filePath: specPath,
        lineNumber: lineMatch.lineNumber,
        raw: lineMatch.raw,
      });
    }
  }
  return collected;
}

export async function removeVisualTestEntries(
  entries: readonly VisualTestEntry[],
): Promise<readonly RemovalResult[]> {
  const entriesByFile = new Map<string, VisualTestEntry[]>();
  for (const entry of entries) {
    const bucket = entriesByFile.get(entry.filePath);
    if (bucket === undefined) {
      entriesByFile.set(entry.filePath, [entry]);
    } else {
      bucket.push(entry);
    }
  }
  const results: RemovalResult[] = [];
  for (const [filePath, fileEntries] of entriesByFile) {
    if (!(await fileExists(filePath))) {
      results.push({ filePath, applied: false });
      continue;
    }
    const originalContent = await readFile(filePath, 'utf8');
    const linesToDrop = new Set<string>();
    for (const entry of fileEntries) {
      linesToDrop.add(entry.raw);
    }
    const lines = originalContent.split('\n');
    const remaining: string[] = [];
    let removedAtLeastOne = false;
    for (const line of lines) {
      if (linesToDrop.has(line)) {
        removedAtLeastOne = true;
        continue;
      }
      remaining.push(line);
    }
    if (!removedAtLeastOne) {
      results.push({ filePath, applied: false });
      continue;
    }
    const nextContent = remaining.join('\n');
    await writeFile(filePath, nextContent, 'utf8');
    results.push({ filePath, applied: true });
  }
  return results;
}

function buildExpectedBaselineNames(slug: string): readonly string[] {
  const names: string[] = [];
  for (const theme of THEMES) {
    for (const lang of LANGS) {
      names.push(`project-${slug}-${theme}-${lang}.png`);
    }
  }
  return names;
}

export async function findOrphanBaselines(
  slug: string,
  baselineDir: string = DEFAULT_BASELINE_DIR,
): Promise<readonly string[]> {
  if (!(await directoryExists(baselineDir))) {
    return [];
  }
  const expected = buildExpectedBaselineNames(slug);
  const found: string[] = [];
  for (const name of expected) {
    const candidate = resolve(baselineDir, name);
    if (await fileExists(candidate)) {
      found.push(candidate);
    }
  }
  return found;
}

export async function removeOrphanBaselines(
  paths: readonly string[],
): Promise<readonly RemovalResult[]> {
  const results: RemovalResult[] = [];
  for (const path of paths) {
    if (!(await fileExists(path))) {
      results.push({ filePath: path, applied: false });
      continue;
    }
    try {
      await unlink(path);
      results.push({ filePath: path, applied: true });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'unknown unlink error';
      results.push({ filePath: path, applied: false, error: message });
    }
  }
  return results;
}

interface RawBlockMatch {
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly snippet: string;
}

function findPositiveBranchBlock(lines: readonly string[], slug: string): RawBlockMatch | null {
  const targetLineFragment = `slug === '${slug}'`;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }
    if (!line.includes(targetLineFragment)) {
      continue;
    }
    let openerLine = index;
    while (openerLine > 0) {
      const previous = lines[openerLine - 1];
      if (previous === undefined) {
        break;
      }
      if (previous.trim() === '{') {
        openerLine -= 1;
        break;
      }
      if (previous.trim() === '') {
        openerLine -= 1;
        continue;
      }
      break;
    }
    let depth = 0;
    let closerLine = openerLine;
    for (let scan = openerLine; scan < lines.length; scan += 1) {
      const scanLine = lines[scan];
      if (scanLine === undefined) {
        continue;
      }
      for (const char of scanLine) {
        if (char === '{') {
          depth += 1;
        } else if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            closerLine = scan;
            break;
          }
        }
      }
      if (depth === 0 && closerLine === scan) {
        break;
      }
    }
    const snippetLines: string[] = [];
    for (let snippetIndex = openerLine; snippetIndex <= closerLine; snippetIndex += 1) {
      const snippetLine = lines[snippetIndex];
      if (snippetLine === undefined) {
        continue;
      }
      snippetLines.push(snippetLine);
    }
    return {
      lineStart: openerLine + 1,
      lineEnd: closerLine + 1,
      snippet: snippetLines.join('\n'),
    };
  }
  return null;
}

function findNegativeGuardLine(lines: readonly string[], slug: string): RawBlockMatch | null {
  const fragment = `slug !== '${slug}'`;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }
    if (line.includes(fragment)) {
      return {
        lineStart: index + 1,
        lineEnd: index + 1,
        snippet: line,
      };
    }
  }
  return null;
}

function findLiteralReferences(
  lines: readonly string[],
  slug: string,
  excludeLineNumbers: ReadonlySet<number>,
): readonly RawBlockMatch[] {
  const literalMatches: RawBlockMatch[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }
    if (excludeLineNumbers.has(index + 1)) {
      continue;
    }
    if (line.includes(slug)) {
      literalMatches.push({
        lineStart: index + 1,
        lineEnd: index + 1,
        snippet: line,
      });
    }
  }
  return literalMatches;
}

export async function findSlugBranches(
  slug: string,
  componentPaths: readonly string[] = DEFAULT_SLUG_BRANCH_TARGETS,
): Promise<readonly SlugBranchMatch[]> {
  const matches: SlugBranchMatch[] = [];
  for (const componentPath of componentPaths) {
    if (!(await fileExists(componentPath))) {
      continue;
    }
    const content = await readFile(componentPath, 'utf8');
    const lines = content.split('\n');
    const positiveBlock = findPositiveBranchBlock(lines, slug);
    const negativeGuard = findNegativeGuardLine(lines, slug);
    const consumedLines = new Set<number>();
    if (positiveBlock !== null) {
      for (let line = positiveBlock.lineStart; line <= positiveBlock.lineEnd; line += 1) {
        consumedLines.add(line);
      }
      matches.push({
        filePath: componentPath,
        lineStart: positiveBlock.lineStart,
        lineEnd: positiveBlock.lineEnd,
        kind: 'positive-branch',
        snippet: positiveBlock.snippet,
        targetSlug: slug,
      });
    }
    if (negativeGuard !== null) {
      consumedLines.add(negativeGuard.lineStart);
      matches.push({
        filePath: componentPath,
        lineStart: negativeGuard.lineStart,
        lineEnd: negativeGuard.lineEnd,
        kind: 'negative-guard',
        snippet: negativeGuard.snippet,
        targetSlug: slug,
      });
    }
    const literalMatches = findLiteralReferences(lines, slug, consumedLines);
    for (const literalMatch of literalMatches) {
      matches.push({
        filePath: componentPath,
        lineStart: literalMatch.lineStart,
        lineEnd: literalMatch.lineEnd,
        kind: 'literal-reference',
        snippet: literalMatch.snippet,
        targetSlug: slug,
      });
    }
  }
  return matches;
}

function removePositiveBranchFromContent(content: string, match: SlugBranchMatch): string | null {
  const lines = content.split('\n');
  const startIndex = match.lineStart - 1;
  const endIndex = match.lineEnd - 1;
  if (startIndex < 0 || endIndex >= lines.length) {
    return null;
  }
  const before = lines.slice(0, startIndex);
  const after = lines.slice(endIndex + 1);
  const trimmedBefore = [...before];
  while (trimmedBefore.length > 0) {
    const last = trimmedBefore[trimmedBefore.length - 1];
    if (last === undefined) {
      break;
    }
    if (last.trim() === '') {
      trimmedBefore.pop();
      continue;
    }
    break;
  }
  const trimmedAfter = [...after];
  while (trimmedAfter.length > 0) {
    const first = trimmedAfter[0];
    if (first === undefined) {
      break;
    }
    if (first.trim() === '') {
      trimmedAfter.shift();
      continue;
    }
    break;
  }
  const separator = trimmedAfter.length > 0 && trimmedBefore.length > 0 ? [''] : [];
  return [...trimmedBefore, ...separator, ...trimmedAfter].join('\n');
}

function removeNegativeGuardFromContent(content: string, slug: string): string | null {
  const inlinePatterns: readonly RegExp[] = [
    new RegExp(`\\s*&&\\s*slug\\s*!==\\s*'${slug}'`, 'g'),
    new RegExp(`slug\\s*!==\\s*'${slug}'\\s*&&\\s*`, 'g'),
  ];
  let nextContent = content;
  let changed = false;
  for (const pattern of inlinePatterns) {
    const replaced = nextContent.replace(pattern, '');
    if (replaced !== nextContent) {
      changed = true;
      nextContent = replaced;
    }
  }
  return changed ? nextContent : null;
}

export async function simplifySlugBranches(
  matches: readonly SlugBranchMatch[],
): Promise<readonly RemovalResult[]> {
  const matchesByFile = new Map<string, SlugBranchMatch[]>();
  for (const match of matches) {
    const bucket = matchesByFile.get(match.filePath);
    if (bucket === undefined) {
      matchesByFile.set(match.filePath, [match]);
    } else {
      bucket.push(match);
    }
  }
  const results: RemovalResult[] = [];
  for (const [filePath, fileMatches] of matchesByFile) {
    if (!(await fileExists(filePath))) {
      for (const match of fileMatches) {
        results.push({ filePath: match.filePath, applied: false });
      }
      continue;
    }
    let content = await readFile(filePath, 'utf8');
    let changedAny = false;
    const literalMatches: SlugBranchMatch[] = [];
    const otherMatches: SlugBranchMatch[] = [];
    for (const match of fileMatches) {
      if (match.kind === 'literal-reference') {
        literalMatches.push(match);
      } else {
        otherMatches.push(match);
      }
    }
    const positiveMatches = otherMatches
      .filter((match) => match.kind === 'positive-branch')
      .sort((firstMatch, secondMatch) => secondMatch.lineStart - firstMatch.lineStart);
    for (const positiveMatch of positiveMatches) {
      const lines = content.split('\n');
      const matchingLine = lines[positiveMatch.lineStart - 1];
      if (
        matchingLine !== undefined &&
        matchingLine.includes(positiveMatch.snippet.split('\n')[0] ?? '')
      ) {
        const next = removePositiveBranchFromContent(content, positiveMatch);
        if (next !== null) {
          content = next;
          changedAny = true;
          results.push({ filePath: positiveMatch.filePath, applied: true });
          continue;
        }
      }
      results.push({ filePath: positiveMatch.filePath, applied: false });
    }
    const negativeMatches = otherMatches.filter((match) => match.kind === 'negative-guard');
    for (const negativeMatch of negativeMatches) {
      const next = removeNegativeGuardFromContent(content, negativeMatch.targetSlug);
      if (next === null) {
        results.push({ filePath: negativeMatch.filePath, applied: false });
        continue;
      }
      content = next;
      changedAny = true;
      results.push({ filePath: negativeMatch.filePath, applied: true });
    }
    for (const literalMatch of literalMatches) {
      const lineNumber = literalMatch.lineStart.toString();
      const errorMessage = `literal-reference at line ${lineNumber} requires manual review`;
      results.push({
        filePath: literalMatch.filePath,
        applied: false,
        error: errorMessage,
      });
    }
    if (changedAny) {
      await writeFile(filePath, content, 'utf8');
    }
  }
  return results;
}
