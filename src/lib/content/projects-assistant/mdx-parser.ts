import type { I18nString } from '@/lib/schemas/i18n-string';

export interface ParsedFrontmatter {
  slug: string;
  title: I18nString;
  company: string;
  year: number;
  featured: boolean;
  tagline: I18nString;
  description: I18nString;
  cover: string;
  tags: string[];
  order: number | undefined;
  eyebrow: I18nString;
  stack: string[];
}

export interface ParsedMetric {
  value: string;
  labelEs: string;
  labelEn: string;
}

export interface ParsedSection {
  labelEs: string;
  labelEn: string;
  prose: I18nString | null;
  metrics: ParsedMetric[] | null;
  archDiagram: string | null;
}

export interface ParsedProject {
  frontmatter: ParsedFrontmatter;
  sections: ParsedSection[];
}

interface FrontmatterScalarBag {
  [key: string]: string | number | boolean | string[] | I18nString;
}

function stripYamlQuotes(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

function parseScalarValue(rawValue: string): string | number | boolean {
  const trimmed = rawValue.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  return stripYamlQuotes(trimmed);
}

function parseFrontmatterBlock(frontmatterLines: readonly string[]): FrontmatterScalarBag {
  const bag: FrontmatterScalarBag = {};
  let cursor = 0;
  while (cursor < frontmatterLines.length) {
    const rawLine = frontmatterLines[cursor];
    if (rawLine === undefined || rawLine.trim().length === 0) {
      cursor += 1;
      continue;
    }
    if (rawLine.startsWith(' ')) {
      cursor += 1;
      continue;
    }
    const colonIndex = rawLine.indexOf(':');
    if (colonIndex === -1) {
      cursor += 1;
      continue;
    }
    const key = rawLine.slice(0, colonIndex).trim();
    const remainder = rawLine.slice(colonIndex + 1);
    if (remainder.trim().length === 0) {
      const lookahead = frontmatterLines[cursor + 1] ?? '';
      if (lookahead.trimStart().startsWith('- ')) {
        const collected: string[] = [];
        let listCursor = cursor + 1;
        while (listCursor < frontmatterLines.length) {
          const listLine = frontmatterLines[listCursor];
          if (listLine === undefined) {
            break;
          }
          if (!listLine.trimStart().startsWith('- ')) {
            break;
          }
          collected.push(stripYamlQuotes(listLine.trimStart().slice(2)));
          listCursor += 1;
        }
        bag[key] = collected;
        cursor = listCursor;
        continue;
      }
      const nestedRecord: Record<string, string> = {};
      let nestedCursor = cursor + 1;
      while (nestedCursor < frontmatterLines.length) {
        const nestedLine = frontmatterLines[nestedCursor];
        if (nestedLine === undefined) {
          break;
        }
        if (!nestedLine.startsWith('  ') || nestedLine.startsWith('  - ')) {
          break;
        }
        const trimmedNested = nestedLine.trim();
        const nestedColon = trimmedNested.indexOf(':');
        if (nestedColon === -1) {
          nestedCursor += 1;
          continue;
        }
        const nestedKey = trimmedNested.slice(0, nestedColon).trim();
        const nestedRawValue = trimmedNested.slice(nestedColon + 1);
        nestedRecord[nestedKey] = stripYamlQuotes(nestedRawValue);
        nestedCursor += 1;
      }
      if (typeof nestedRecord['es'] === 'string' && typeof nestedRecord['en'] === 'string') {
        bag[key] = { es: nestedRecord['es'], en: nestedRecord['en'] };
      }
      cursor = nestedCursor;
      continue;
    }
    bag[key] = parseScalarValue(remainder);
    cursor += 1;
  }
  return bag;
}

function expectI18nString(bag: FrontmatterScalarBag, key: string): I18nString {
  const value = bag[key];
  if (
    value === undefined ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof (value as I18nString).es !== 'string' ||
    typeof (value as I18nString).en !== 'string'
  ) {
    throw new Error(`mdx-parser: expected i18n string for "${key}"`);
  }
  return value as I18nString;
}

function expectString(bag: FrontmatterScalarBag, key: string): string {
  const value = bag[key];
  if (typeof value !== 'string') {
    throw new Error(`mdx-parser: expected string for "${key}"`);
  }
  return value;
}

function expectNumber(bag: FrontmatterScalarBag, key: string): number {
  const value = bag[key];
  if (typeof value !== 'number') {
    throw new Error(`mdx-parser: expected number for "${key}"`);
  }
  return value;
}

function expectBoolean(bag: FrontmatterScalarBag, key: string): boolean {
  const value = bag[key];
  if (typeof value !== 'boolean') {
    throw new Error(`mdx-parser: expected boolean for "${key}"`);
  }
  return value;
}

function expectStringList(bag: FrontmatterScalarBag, key: string): string[] {
  const value = bag[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`mdx-parser: expected string array for "${key}"`);
  }
  return value;
}

function optionalNumber(bag: FrontmatterScalarBag, key: string): number | undefined {
  const value = bag[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number') {
    throw new Error(`mdx-parser: expected number for "${key}"`);
  }
  return value;
}

function readAttribute(tag: string, attributeName: string): string | null {
  const pattern = new RegExp(`${attributeName}="([^"]*)"`);
  const match = pattern.exec(tag);
  return match === null ? null : (match[1] ?? null);
}

function extractFrontmatter(mdx: string): { frontmatter: ParsedFrontmatter; bodyOffset: number } {
  const lines = mdx.split('\n');
  if (lines[0] !== '---') {
    throw new Error('mdx-parser: frontmatter must start with --- on the first line');
  }
  const closingIndex = lines.indexOf('---', 1);
  if (closingIndex === -1) {
    throw new Error('mdx-parser: frontmatter must be closed with ---');
  }
  const frontmatterLines = lines.slice(1, closingIndex);
  const bag = parseFrontmatterBlock(frontmatterLines);
  const frontmatter: ParsedFrontmatter = {
    slug: expectString(bag, 'slug'),
    title: expectI18nString(bag, 'title'),
    company: expectString(bag, 'company'),
    year: expectNumber(bag, 'year'),
    featured: expectBoolean(bag, 'featured'),
    tagline: expectI18nString(bag, 'tagline'),
    description: expectI18nString(bag, 'description'),
    cover: expectString(bag, 'cover'),
    tags: expectStringList(bag, 'tags'),
    order: optionalNumber(bag, 'order'),
    eyebrow: expectI18nString(bag, 'eyebrow'),
    stack: expectStringList(bag, 'stack'),
  };
  const bodyOffset = lines.slice(0, closingIndex + 1).join('\n').length + 1;
  return { frontmatter, bodyOffset };
}

function extractProjectSections(body: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const openTagRegex = /<ProjectSection\b[^>]*>/g;
  const closeTag = '</ProjectSection>';
  let openMatch = openTagRegex.exec(body);
  while (openMatch !== null) {
    const openTag = openMatch[0];
    const openIndex = openMatch.index;
    const innerStart = openIndex + openTag.length;
    const closeIndex = body.indexOf(closeTag, innerStart);
    if (closeIndex === -1) {
      throw new Error('mdx-parser: ProjectSection block is not closed');
    }
    const innerContent = body.slice(innerStart, closeIndex);
    const labelEs = readAttribute(openTag, 'labelEs') ?? '';
    const labelEn = readAttribute(openTag, 'labelEn') ?? '';
    sections.push({
      labelEs,
      labelEn,
      prose: extractProse(innerContent),
      metrics: extractMetrics(innerContent),
      archDiagram: extractArchDiagram(innerContent),
    });
    openTagRegex.lastIndex = closeIndex + closeTag.length;
    openMatch = openTagRegex.exec(body);
  }
  return sections;
}

function extractProse(innerContent: string): I18nString | null {
  const langEs = extractLangBlock(innerContent, 'es');
  const langEn = extractLangBlock(innerContent, 'en');
  if (langEs === null && langEn === null) {
    return null;
  }
  return {
    es: langEs ?? '',
    en: langEn ?? '',
  };
}

function extractLangBlock(innerContent: string, languageCode: 'es' | 'en'): string | null {
  const openPattern = new RegExp(`<Lang\\s+lang="${languageCode}"\\s*>`);
  const openMatch = openPattern.exec(innerContent);
  if (openMatch === null) return null;
  const innerStart = openMatch.index + openMatch[0].length;
  const closeIndex = innerContent.indexOf('</Lang>', innerStart);
  if (closeIndex === -1) return null;
  return innerContent.slice(innerStart, closeIndex).trim();
}

function extractMetrics(innerContent: string): ParsedMetric[] | null {
  const gridOpen = innerContent.indexOf('<MetricGrid>');
  if (gridOpen === -1) return null;
  const gridClose = innerContent.indexOf('</MetricGrid>', gridOpen);
  if (gridClose === -1) return null;
  const gridInner = innerContent.slice(gridOpen + '<MetricGrid>'.length, gridClose);
  const metricRegex = /<Metric\b([^/]*?)\/>/g;
  const metrics: ParsedMetric[] = [];
  let metricMatch = metricRegex.exec(gridInner);
  while (metricMatch !== null) {
    const attributes = metricMatch[1] ?? '';
    metrics.push({
      value: readAttribute(attributes, 'value') ?? '',
      labelEs: readAttribute(attributes, 'labelEs') ?? '',
      labelEn: readAttribute(attributes, 'labelEn') ?? '',
    });
    metricMatch = metricRegex.exec(gridInner);
  }
  return metrics;
}

function extractArchDiagram(innerContent: string): string | null {
  const archOpen = innerContent.indexOf('<ArchDiagram>');
  if (archOpen === -1) return null;
  const archClose = innerContent.indexOf('</ArchDiagram>', archOpen);
  if (archClose === -1) return null;
  const archInner = innerContent.slice(archOpen + '<ArchDiagram>'.length, archClose);
  return archInner.replace(/^\n+/, '').replace(/\n+\s*$/, '');
}

export function parseProjectMdx(mdxContent: string): ParsedProject {
  const { frontmatter, bodyOffset } = extractFrontmatter(mdxContent);
  const body = mdxContent.slice(bodyOffset);
  const sections = extractProjectSections(body);
  return { frontmatter, sections };
}
