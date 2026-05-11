import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildProjectMdx } from '@/lib/content/projects-assistant/mdx-builder';
import type { BuildProjectMdxInput } from '@/lib/content/projects-assistant/mdx-builder';
import { parseProjectMdx } from '@/lib/content/projects-assistant/mdx-parser';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../../../../');
const PROJECTS_DIR = resolve(REPO_ROOT, 'src/content/projects');

function readProject(filename: string): string {
  return readFileSync(resolve(PROJECTS_DIR, filename), 'utf8');
}

describe('parseProjectMdx: frontmatter extraction on real projects', () => {
  it('extracts the cluster-separation frontmatter', () => {
    const mdx = readProject('cluster-separation.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.frontmatter.slug).toBe('cluster-separation');
    expect(parsed.frontmatter.company).toBe('tokenproof');
    expect(parsed.frontmatter.year).toBe(2023);
    expect(parsed.frontmatter.featured).toBe(true);
    expect(parsed.frontmatter.order).toBe(3);
    expect(parsed.frontmatter.cover).toBe('./cover.png');
    expect(parsed.frontmatter.title.es).toBe('Separación de Clusters');
    expect(parsed.frontmatter.title.en).toBe('Cluster Separation');
    expect(parsed.frontmatter.tags).toEqual(['Terraform', 'EKS', 'IaC', 'CI/CD']);
    expect(parsed.frontmatter.stack).toEqual(['Terraform', 'Terragrunt', 'EKS', 'GitHub Actions']);
    expect(parsed.frontmatter.eyebrow.es).toBe('infraestructura');
    expect(parsed.frontmatter.eyebrow.en).toBe('infrastructure');
  });

  it('extracts the incommers-nft frontmatter', () => {
    const mdx = readProject('incommers-nft.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.frontmatter.slug).toBe('incommers-nft');
    expect(parsed.frontmatter.company).toBe('MetaOne');
    expect(parsed.frontmatter.year).toBe(2024);
    expect(parsed.frontmatter.order).toBe(2);
    expect(parsed.frontmatter.featured).toBe(true);
  });

  it('extracts the made-by-apes frontmatter', () => {
    const mdx = readProject('made-by-apes.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.frontmatter.slug).toBe('made-by-apes');
    expect(parsed.frontmatter.company).toBe('Yuga Labs');
    expect(parsed.frontmatter.year).toBe(2025);
    expect(parsed.frontmatter.order).toBe(1);
    expect(parsed.frontmatter.featured).toBe(true);
    expect(parsed.frontmatter.eyebrow.es).toBe('proyecto destacado');
    expect(parsed.frontmatter.eyebrow.en).toBe('featured project');
  });
});

describe('parseProjectMdx: section extraction on real projects', () => {
  it('finds 3 sections in cluster-separation with the expected labels and ArchDiagram on the third', () => {
    const mdx = readProject('cluster-separation.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.sections).toHaveLength(3);
    const firstSection = parsed.sections[0];
    const secondSection = parsed.sections[1];
    const thirdSection = parsed.sections[2];
    if (firstSection === undefined || secondSection === undefined || thirdSection === undefined) {
      throw new Error('expected 3 sections');
    }
    expect(firstSection.labelEs).toBe('problema');
    expect(firstSection.labelEn).toBe('problem');
    expect(secondSection.labelEs).toBe('impacto');
    expect(secondSection.labelEn).toBe('impact');
    expect(secondSection.metrics).not.toBeNull();
    expect(secondSection.metrics).toHaveLength(3);
    expect(thirdSection.labelEs).toBe('decisiones');
    expect(thirdSection.labelEn).toBe('decisions');
    expect(thirdSection.archDiagram).not.toBeNull();
  });

  it('finds 3 sections in incommers-nft, the impact section carries 3 metrics, the decisions section carries an ArchDiagram', () => {
    const mdx = readProject('incommers-nft.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.sections).toHaveLength(3);
    const impactSection = parsed.sections.find((section) => section.labelEn === 'impact');
    const decisionsSection = parsed.sections.find((section) => section.labelEn === 'decisions');
    expect(impactSection).toBeDefined();
    expect(decisionsSection).toBeDefined();
    if (impactSection === undefined || decisionsSection === undefined) {
      throw new Error('expected impact and decisions sections');
    }
    expect(impactSection.metrics).toHaveLength(3);
    expect(decisionsSection.archDiagram).not.toBeNull();
  });

  it('finds 4 sections in made-by-apes including an ArchDiagram on decisions', () => {
    const mdx = readProject('made-by-apes.mdx');
    const parsed = parseProjectMdx(mdx);
    expect(parsed.sections).toHaveLength(4);
    const decisionsSection = parsed.sections.find((section) => section.labelEn === 'decisions');
    expect(decisionsSection).toBeDefined();
    if (decisionsSection === undefined) {
      throw new Error('expected decisions section');
    }
    expect(decisionsSection.archDiagram).not.toBeNull();
  });

  it('captures prose for both languages on context section of made-by-apes', () => {
    const mdx = readProject('made-by-apes.mdx');
    const parsed = parseProjectMdx(mdx);
    const contextSection = parsed.sections.find((section) => section.labelEn === 'context');
    expect(contextSection).toBeDefined();
    if (contextSection === undefined) {
      throw new Error('expected context section');
    }
    expect(contextSection.prose).not.toBeNull();
    if (contextSection.prose === null) {
      throw new Error('expected prose on context section');
    }
    expect(contextSection.prose.es).toContain('BAYC y MAYC');
    expect(contextSection.prose.en).toContain('BAYC and MAYC');
  });
});

describe('parseProjectMdx: round-trip with buildProjectMdx', () => {
  function makeInput(): BuildProjectMdxInput {
    return {
      slug: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000',
      title: { es: 'Round trip', en: 'Round trip' },
      company: 'Acme',
      year: 2024,
      featured: true,
      order: 2,
      tagline: { es: 'tagline es.', en: 'tagline en.' },
      description: { es: 'description es.', en: 'description en.' },
      tags: ['Alpha', 'Beta'],
      eyebrow: { es: 'cat es', en: 'cat en' },
      stack: ['TypeScript', 'PostgreSQL'],
      sections: [
        {
          labelEs: 'contexto',
          labelEn: 'context',
          prose: { es: 'parrafo es.', en: 'paragraph en.' },
        },
        {
          labelEs: 'impacto',
          labelEn: 'impact',
          metrics: [
            { value: '0', labelEs: 'incidentes', labelEn: 'incidents' },
            { value: '3x', labelEs: 'mas rapido', labelEn: 'faster' },
          ],
        },
        {
          labelEs: 'arch',
          labelEn: 'arch',
          archDiagram: '  node A -> node B',
        },
      ],
    };
  }

  it('preserves every frontmatter field through parse → build → parse', () => {
    const input = makeInput();
    const firstMdx = buildProjectMdx(input);
    const firstParse = parseProjectMdx(firstMdx);
    const secondMdx = buildProjectMdx({
      slug: firstParse.frontmatter.slug,
      title: firstParse.frontmatter.title,
      company: firstParse.frontmatter.company,
      year: firstParse.frontmatter.year,
      featured: firstParse.frontmatter.featured,
      order: firstParse.frontmatter.order,
      tagline: firstParse.frontmatter.tagline,
      description: firstParse.frontmatter.description,
      tags: firstParse.frontmatter.tags,
      eyebrow: firstParse.frontmatter.eyebrow,
      stack: firstParse.frontmatter.stack,
      sections: firstParse.sections.map((section) => ({
        labelEs: section.labelEs,
        labelEn: section.labelEn,
        prose: section.prose,
        metrics: section.metrics,
        archDiagram: section.archDiagram,
      })),
    });
    const secondParse = parseProjectMdx(secondMdx);
    expect(secondParse.frontmatter).toEqual(firstParse.frontmatter);
  });

  it('preserves section count, labels, prose and metrics through parse → build → parse', () => {
    const input = makeInput();
    const firstMdx = buildProjectMdx(input);
    const firstParse = parseProjectMdx(firstMdx);
    const secondMdx = buildProjectMdx({
      slug: firstParse.frontmatter.slug,
      title: firstParse.frontmatter.title,
      company: firstParse.frontmatter.company,
      year: firstParse.frontmatter.year,
      featured: firstParse.frontmatter.featured,
      order: firstParse.frontmatter.order,
      tagline: firstParse.frontmatter.tagline,
      description: firstParse.frontmatter.description,
      tags: firstParse.frontmatter.tags,
      eyebrow: firstParse.frontmatter.eyebrow,
      stack: firstParse.frontmatter.stack,
      sections: firstParse.sections.map((section) => ({
        labelEs: section.labelEs,
        labelEn: section.labelEn,
        prose: section.prose,
        metrics: section.metrics,
        archDiagram: section.archDiagram,
      })),
    });
    const secondParse = parseProjectMdx(secondMdx);
    expect(secondParse.sections).toHaveLength(firstParse.sections.length);
    for (let sectionIndex = 0; sectionIndex < firstParse.sections.length; sectionIndex += 1) {
      const beforeSection = firstParse.sections[sectionIndex];
      const afterSection = secondParse.sections[sectionIndex];
      expect(beforeSection).toBeDefined();
      expect(afterSection).toBeDefined();
      if (beforeSection === undefined || afterSection === undefined) {
        throw new Error('section out of bounds during round-trip');
      }
      expect(afterSection.labelEs).toBe(beforeSection.labelEs);
      expect(afterSection.labelEn).toBe(beforeSection.labelEn);
      expect(afterSection.prose).toEqual(beforeSection.prose);
      expect(afterSection.metrics).toEqual(beforeSection.metrics);
      expect(afterSection.archDiagram).toEqual(beforeSection.archDiagram);
    }
  });
});
