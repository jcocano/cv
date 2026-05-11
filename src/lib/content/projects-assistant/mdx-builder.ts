import type { I18nString } from '@/lib/schemas/i18n-string';

export interface BuildProjectMdxMetricInput {
  value: string;
  labelEs: string;
  labelEn: string;
}

export interface BuildProjectMdxSectionInput {
  labelEs: string;
  labelEn: string;
  prose?: I18nString | null;
  metrics?: BuildProjectMdxMetricInput[] | null;
  archDiagram?: string | null;
}

export interface BuildProjectMdxInput {
  slug: string;
  title: I18nString;
  company: string;
  year: number;
  featured: boolean;
  tagline: I18nString;
  description: I18nString;
  tags: string[];
  order?: number;
  eyebrow: I18nString;
  stack: string[];
  sections: BuildProjectMdxSectionInput[];
}

const EM_DASH_PATTERN = /—/g;
const EM_DASH_REPLACEMENT = ', ';
const COVER_LITERAL = './cover.png';

function stripEmDashes(value: string): string {
  return value.replace(EM_DASH_PATTERN, EM_DASH_REPLACEMENT);
}

function quoteYamlScalar(value: string): string {
  const escaped = stripEmDashes(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

function emitI18nField(fieldName: string, value: I18nString): string {
  return [
    `${fieldName}:`,
    `  es: ${quoteYamlScalar(value.es)}`,
    `  en: ${quoteYamlScalar(value.en)}`,
  ].join('\n');
}

function emitStringList(fieldName: string, values: readonly string[]): string {
  if (values.length === 0) {
    return `${fieldName}: []`;
  }
  const lines = [`${fieldName}:`];
  for (const value of values) {
    lines.push(`  - ${quoteYamlScalar(value)}`);
  }
  return lines.join('\n');
}

function emitFrontmatter(input: BuildProjectMdxInput): string {
  const lines: string[] = ['---'];
  lines.push(`slug: ${quoteYamlScalar(input.slug)}`);
  lines.push(emitI18nField('title', input.title));
  lines.push(`company: ${quoteYamlScalar(input.company)}`);
  lines.push(`year: ${input.year.toString()}`);
  lines.push(`featured: ${input.featured ? 'true' : 'false'}`);
  lines.push(emitI18nField('tagline', input.tagline));
  lines.push(emitI18nField('description', input.description));
  lines.push(`cover: ${quoteYamlScalar(COVER_LITERAL)}`);
  lines.push(emitStringList('tags', input.tags));
  if (input.featured && input.order !== undefined) {
    lines.push(`order: ${input.order.toString()}`);
  }
  lines.push(emitI18nField('eyebrow', input.eyebrow));
  lines.push(emitStringList('stack', input.stack));
  lines.push('---');
  return lines.join('\n');
}

function escapeAttribute(value: string): string {
  return stripEmDashes(value).replace(/"/g, '&quot;');
}

function emitImports(input: BuildProjectMdxInput): string {
  const lines = [
    "import Lang from '@/components/ui/Lang.astro';",
    "import ProjectSection from '@/components/projects/ProjectSection.astro';",
  ];
  const usesMetrics = input.sections.some(
    (section) =>
      section.metrics !== undefined && section.metrics !== null && section.metrics.length > 0,
  );
  const usesArchDiagram = input.sections.some(
    (section) =>
      section.archDiagram !== undefined &&
      section.archDiagram !== null &&
      section.archDiagram.length > 0,
  );
  if (usesMetrics) {
    lines.push("import MetricGrid from '@/components/projects/MetricGrid.astro';");
    lines.push("import Metric from '@/components/projects/Metric.astro';");
  }
  if (usesArchDiagram) {
    lines.push("import ArchDiagram from '@/components/projects/ArchDiagram.astro';");
  }
  return lines.join('\n');
}

function emitProseBlock(prose: I18nString): string {
  const cleanedEs = stripEmDashes(prose.es);
  const cleanedEn = stripEmDashes(prose.en);
  return [
    '  <Lang lang="es">',
    '',
    cleanedEs,
    '',
    '  </Lang>',
    '  <Lang lang="en">',
    '',
    cleanedEn,
    '',
    '  </Lang>',
  ].join('\n');
}

function emitMetricsBlock(metrics: readonly BuildProjectMdxMetricInput[]): string {
  const lines: string[] = ['  <MetricGrid>'];
  for (const metric of metrics) {
    lines.push(
      `    <Metric value="${escapeAttribute(metric.value)}" labelEs="${escapeAttribute(metric.labelEs)}" labelEn="${escapeAttribute(metric.labelEn)}" />`,
    );
  }
  lines.push('  </MetricGrid>');
  return lines.join('\n');
}

function emitArchDiagramBlock(archDiagram: string): string {
  const cleaned = stripEmDashes(archDiagram);
  return ['  <ArchDiagram>', cleaned, '  </ArchDiagram>'].join('\n');
}

function emitSection(section: BuildProjectMdxSectionInput): string {
  const lines: string[] = [];
  lines.push(
    `<ProjectSection labelEs="${escapeAttribute(section.labelEs)}" labelEn="${escapeAttribute(section.labelEn)}">`,
  );
  if (section.prose !== undefined && section.prose !== null) {
    lines.push(emitProseBlock(section.prose));
  }
  if (section.metrics !== undefined && section.metrics !== null && section.metrics.length > 0) {
    lines.push(emitMetricsBlock(section.metrics));
  }
  if (
    section.archDiagram !== undefined &&
    section.archDiagram !== null &&
    section.archDiagram.length > 0
  ) {
    lines.push(emitArchDiagramBlock(section.archDiagram));
  }
  lines.push('</ProjectSection>');
  return lines.join('\n');
}

export function buildProjectMdx(input: BuildProjectMdxInput): string {
  const frontmatter = emitFrontmatter(input);
  const imports = emitImports(input);
  const sectionBlocks = input.sections.map(emitSection).join('\n\n');
  return [frontmatter, '', imports, '', sectionBlocks, ''].join('\n');
}
