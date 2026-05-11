import { describe, expect, it } from 'vitest';

import { buildProjectMdx } from '@/lib/content/projects-assistant/mdx-builder';
import type { BuildProjectMdxInput } from '@/lib/content/projects-assistant/mdx-builder';
import { projectSchema } from '@/lib/schemas/projects';

function parseFrontmatter(mdxString: string): Record<string, unknown> {
  const lines = mdxString.split('\n');
  const firstFence = lines.indexOf('---');
  const secondFence = lines.indexOf('---', firstFence + 1);
  if (firstFence !== 0 || secondFence === -1) {
    throw new Error('mdx must start with a YAML frontmatter block delimited by ---');
  }
  const frontmatterLines = lines.slice(firstFence + 1, secondFence);
  return parseFrontmatterLines(frontmatterLines);
}

function parseFrontmatterLines(frontmatterLines: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let cursor = 0;
  while (cursor < frontmatterLines.length) {
    const rawLine = frontmatterLines[cursor];
    if (rawLine === undefined || rawLine.length === 0) {
      cursor += 1;
      continue;
    }
    const trimmedLine = rawLine.trimEnd();
    if (trimmedLine.startsWith('  ')) {
      cursor += 1;
      continue;
    }
    const colonIndex = trimmedLine.indexOf(':');
    const key = trimmedLine.slice(0, colonIndex).trim();
    const remainder = trimmedLine.slice(colonIndex + 1).trim();
    if (remainder.length === 0) {
      const nextLine = frontmatterLines[cursor + 1] ?? '';
      if (nextLine.trimStart().startsWith('- ')) {
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
          collected.push(stripQuotes(listLine.trimStart().slice(2).trim()));
          listCursor += 1;
        }
        result[key] = collected;
        cursor = listCursor;
        continue;
      }
      const nested: Record<string, string> = {};
      let nestedCursor = cursor + 1;
      while (nestedCursor < frontmatterLines.length) {
        const nestedLine = frontmatterLines[nestedCursor];
        if (nestedLine === undefined) {
          break;
        }
        if (!nestedLine.startsWith('  ') || nestedLine.startsWith('  - ')) {
          break;
        }
        const nestedTrimmed = nestedLine.trim();
        const nestedColonIndex = nestedTrimmed.indexOf(':');
        const nestedKey = nestedTrimmed.slice(0, nestedColonIndex).trim();
        const nestedValue = stripQuotes(nestedTrimmed.slice(nestedColonIndex + 1).trim());
        nested[nestedKey] = nestedValue;
        nestedCursor += 1;
      }
      result[key] = nested;
      cursor = nestedCursor;
      continue;
    }
    result[key] = parseScalar(remainder);
    cursor += 1;
  }
  return result;
}

function parseScalar(raw: string): string | number | boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return Number.parseInt(raw, 10);
  return stripQuotes(raw);
}

function stripQuotes(value: string): string {
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function makeValidInput(overrides: Partial<BuildProjectMdxInput> = {}): BuildProjectMdxInput {
  const base: BuildProjectMdxInput = {
    slug: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000',
    title: { es: 'Mi proyecto', en: 'My project' },
    company: 'Acme',
    year: 2024,
    featured: false,
    tagline: { es: 'Una línea.', en: 'One line.' },
    description: { es: 'Descripción ES.', en: 'Description EN.' },
    tags: ['Tag1', 'Tag2'],
    eyebrow: { es: 'categoria', en: 'category' },
    stack: ['TypeScript', 'PostgreSQL'],
    sections: [
      {
        labelEs: 'contexto',
        labelEn: 'context',
        prose: { es: 'Texto ES.', en: 'Text EN.' },
      },
    ],
  };
  return { ...base, ...overrides };
}

describe('buildProjectMdx — frontmatter round-trip', () => {
  it('emits a frontmatter that parses through projectSchema with cover normalised to ./cover.png', () => {
    const input = makeValidInput();
    const mdx = buildProjectMdx(input);
    const parsedFrontmatter = parseFrontmatter(mdx);
    const result = projectSchema.safeParse(parsedFrontmatter);
    expect(result.success).toBe(true);
    expect(parsedFrontmatter['cover']).toBe('./cover.png');
  });

  it('keeps order in the frontmatter when the project is featured', () => {
    const input = makeValidInput({ featured: true, order: 2 });
    const mdx = buildProjectMdx(input);
    const parsedFrontmatter = parseFrontmatter(mdx);
    const result = projectSchema.safeParse(parsedFrontmatter);
    expect(result.success).toBe(true);
    expect(parsedFrontmatter['featured']).toBe(true);
    expect(parsedFrontmatter['order']).toBe(2);
  });

  it('omits order from the frontmatter when the project is not featured', () => {
    const input = makeValidInput({ featured: false });
    const mdx = buildProjectMdx(input);
    expect(mdx).not.toMatch(/^order:/m);
    const parsedFrontmatter = parseFrontmatter(mdx);
    const result = projectSchema.safeParse(parsedFrontmatter);
    expect(result.success).toBe(true);
  });

  it('preserves the slug as written in the input', () => {
    const targetSlug = 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000';
    const mdx = buildProjectMdx(makeValidInput({ slug: targetSlug }));
    const parsedFrontmatter = parseFrontmatter(mdx);
    expect(parsedFrontmatter['slug']).toBe(targetSlug);
  });
});

describe('buildProjectMdx — no em-dashes', () => {
  it('strips em-dashes from i18n strings, replacing them with comma and space', () => {
    const input = makeValidInput({
      title: { es: 'Algo — destacado', en: 'Something — featured' },
      tagline: { es: 'a — b', en: 'a — b' },
      description: { es: 'foo — bar', en: 'foo — bar' },
      eyebrow: { es: 'destaque — uno', en: 'feature — one' },
    });
    const mdx = buildProjectMdx(input);
    expect(mdx).not.toContain('—');
  });

  it('strips em-dashes from section prose, metric labels, and archDiagram', () => {
    const input = makeValidInput({
      sections: [
        {
          labelEs: 'a — b',
          labelEn: 'a — b',
          prose: { es: 'prose — es', en: 'prose — en' },
        },
        {
          labelEs: 'impact',
          labelEn: 'impact',
          metrics: [{ value: '1×', labelEs: 'metric — es', labelEn: 'metric — en' }],
        },
        {
          labelEs: 'arch',
          labelEn: 'arch',
          archDiagram: 'node A — node B',
        },
      ],
    });
    const mdx = buildProjectMdx(input);
    expect(mdx).not.toContain('—');
  });
});

describe('buildProjectMdx — no human comments', () => {
  it('emits no JSX style human comments such as {/* ... */} or HTML comments', () => {
    const mdx = buildProjectMdx(makeValidInput());
    expect(mdx).not.toMatch(/\{\/\*/);
    expect(mdx).not.toMatch(/\*\/\}/);
    expect(mdx).not.toContain('<!--');
    expect(mdx).not.toContain('-->');
  });
});

describe('buildProjectMdx — imports', () => {
  it('always imports Lang and ProjectSection', () => {
    const mdx = buildProjectMdx(makeValidInput());
    expect(mdx).toContain("import Lang from '@/components/ui/Lang.astro';");
    expect(mdx).toContain(
      "import ProjectSection from '@/components/projects/ProjectSection.astro';",
    );
  });

  it('only imports MetricGrid and Metric when at least one section declares metrics', () => {
    const mdxWithoutMetrics = buildProjectMdx(makeValidInput());
    expect(mdxWithoutMetrics).not.toContain('import MetricGrid');
    expect(mdxWithoutMetrics).not.toContain('import Metric ');
    const mdxWithMetrics = buildProjectMdx(
      makeValidInput({
        sections: [
          {
            labelEs: 'impacto',
            labelEn: 'impact',
            metrics: [{ value: '1×', labelEs: 'a', labelEn: 'a' }],
          },
        ],
      }),
    );
    expect(mdxWithMetrics).toContain(
      "import MetricGrid from '@/components/projects/MetricGrid.astro';",
    );
    expect(mdxWithMetrics).toContain("import Metric from '@/components/projects/Metric.astro';");
  });

  it('only imports ArchDiagram when at least one section declares an archDiagram', () => {
    const mdxWithout = buildProjectMdx(makeValidInput());
    expect(mdxWithout).not.toContain('import ArchDiagram');
    const mdxWith = buildProjectMdx(
      makeValidInput({
        sections: [
          {
            labelEs: 'arch',
            labelEn: 'arch',
            archDiagram: 'node A -> node B',
          },
        ],
      }),
    );
    expect(mdxWith).toContain("import ArchDiagram from '@/components/projects/ArchDiagram.astro';");
  });
});

describe('buildProjectMdx — section bodies', () => {
  it('wraps prose in a <Lang lang="es"> and <Lang lang="en"> with blank lines for markdown', () => {
    const mdx = buildProjectMdx(
      makeValidInput({
        sections: [
          {
            labelEs: 'contexto',
            labelEn: 'context',
            prose: { es: 'parrafo es.', en: 'paragraph en.' },
          },
        ],
      }),
    );
    expect(mdx).toContain('<Lang lang="es">');
    expect(mdx).toContain('<Lang lang="en">');
    expect(mdx).toContain('parrafo es.');
    expect(mdx).toContain('paragraph en.');
  });

  it('emits a MetricGrid with one Metric child per metric and matching value/labelEs/labelEn', () => {
    const mdx = buildProjectMdx(
      makeValidInput({
        sections: [
          {
            labelEs: 'impacto',
            labelEn: 'impact',
            metrics: [
              { value: '0', labelEs: 'incidentes', labelEn: 'incidents' },
              { value: '3×', labelEs: 'mas rapido', labelEn: 'faster' },
            ],
          },
        ],
      }),
    );
    expect(mdx).toContain('<MetricGrid>');
    expect(mdx).toContain('</MetricGrid>');
    expect(mdx).toContain('value="0"');
    expect(mdx).toContain('labelEs="incidentes"');
    expect(mdx).toContain('labelEn="incidents"');
    expect(mdx).toContain('value="3×"');
    expect(mdx).toContain('labelEs="mas rapido"');
    expect(mdx).toContain('labelEn="faster"');
  });

  it('emits an ArchDiagram block when archDiagram is provided', () => {
    const mdx = buildProjectMdx(
      makeValidInput({
        sections: [
          {
            labelEs: 'arch',
            labelEn: 'arch',
            archDiagram: '  node A -> node B',
          },
        ],
      }),
    );
    expect(mdx).toContain('<ArchDiagram>');
    expect(mdx).toContain('</ArchDiagram>');
    expect(mdx).toContain('node A -> node B');
  });

  it('emits ProjectSection wrappers with labelEs and labelEn from the input', () => {
    const mdx = buildProjectMdx(
      makeValidInput({
        sections: [{ labelEs: 'reto', labelEn: 'challenge', prose: { es: 'es.', en: 'en.' } }],
      }),
    );
    expect(mdx).toContain('<ProjectSection labelEs="reto" labelEn="challenge">');
    expect(mdx).toContain('</ProjectSection>');
  });
});
