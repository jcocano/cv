import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ProjectsIndexContent from '@/components/work/ProjectsIndexContent.astro';
import type { Project } from '@/lib/schemas/projects';

interface RenderArgs {
  projects: Project[];
  baseUrl?: string;
}

async function renderContent({ projects, baseUrl = '/cv/' }: RenderArgs): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectsIndexContent, {
    props: { projects, baseUrl },
  });
}

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug'>): Project {
  const base: Project = {
    slug: overrides.slug,
    title: { es: overrides.slug, en: overrides.slug },
    company: 'Acme',
    year: 2024,
    featured: false,
    tagline: { es: 't-es', en: 't-en' },
    description: { es: 'd-es', en: 'd-en' },
    cover: './cover.png',
    tags: [],
    eyebrow: { es: 'eyebrow', en: 'eyebrow' },
    stack: ['stack'],
  };
  return { ...base, ...overrides };
}

describe('ProjectsIndexContent (render-test)', () => {
  it('renders the BackToHomeLink anchor at the top with bilingual copy', async () => {
    const html = await renderContent({ projects: [] });
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>← Inicio<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>← Home<\/span>/);
  });

  it('places the BackToHomeLink BEFORE the SectionHead', async () => {
    const html = await renderContent({
      projects: [makeProject({ slug: 'hero', featured: true, order: 1, year: 2025 })],
    });
    const backIdx = html.indexOf('← Inicio');
    const sectionHeadIdx = html.indexOf('Todos los proyectos');
    expect(backIdx).toBeGreaterThan(-1);
    expect(sectionHeadIdx).toBeGreaterThan(-1);
    expect(backIdx).toBeLessThan(sectionHeadIdx);
  });

  it('renders the main SectionHead with the eyebrow num "◆"', async () => {
    const html = await renderContent({ projects: [] });
    expect(html).toMatch(/<span[^>]*>◆<\/span>/);
  });

  it('renders the bilingual main title "Todos los proyectos." / "All projects."', async () => {
    const html = await renderContent({ projects: [] });
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Todos los proyectos\.<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>All projects\.<\/span>/);
  });

  it('renders the bilingual lede paragraph', async () => {
    const html = await renderContent({ projects: [] });
    expect(html).toContain('Lo que llega al CV es solo una selección');
    expect(html).toContain('Only a selection lands on the CV');
  });

  it('does NOT render any sub-eyebrow ◆.1 / ◆.2 / ◆.3', async () => {
    const html = await renderContent({
      projects: [makeProject({ slug: 'hero', featured: true, order: 1, year: 2025 })],
    });
    expect(html).not.toMatch(/>◆\.1</);
    expect(html).not.toMatch(/>◆\.2</);
    expect(html).not.toMatch(/>◆\.3</);
  });

  it('does NOT render any deprecated data-block (oss / side / case-studies / more)', async () => {
    const html = await renderContent({
      projects: [makeProject({ slug: 'hero', featured: true, order: 1, year: 2025 })],
    });
    expect(html).not.toContain('data-block="oss"');
    expect(html).not.toContain('data-block="side"');
    expect(html).not.toContain('data-block="case-studies"');
    expect(html).not.toContain('data-block="more"');
  });

  it('does NOT render OSS or Side eyebrow copy', async () => {
    const html = await renderContent({
      projects: [makeProject({ slug: 'hero', featured: true, order: 1, year: 2025 })],
    });
    expect(html).not.toContain('open source');
    expect(html).not.toContain('proyectos personales');
    expect(html).not.toContain('side projects');
  });

  it('does not crash when the projects collection is empty (defensive guard)', async () => {
    const html = await renderContent({ projects: [] });
    expect(html).not.toMatch(/href="\/cv\/projects\/[^"/]+"/);
    expect(html).toContain('Todos los proyectos');
  });

  it('renders one ProjectRow anchor per case study (3 rows for 3 projects)', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'hero', featured: true, order: 1, year: 2025 }),
      makeProject({ slug: 'second', featured: true, order: 2, year: 2024 }),
      makeProject({ slug: 'third', featured: true, order: 3, year: 2023 }),
    ];
    const html = await renderContent({ projects });
    const projectAnchorMatches = html.match(/href="\/cv\/projects\/(hero|second|third)"/g);
    expect(projectAnchorMatches).not.toBeNull();
    if (projectAnchorMatches === null) {
      throw new Error('expected three project anchors');
    }
    expect(projectAnchorMatches).toHaveLength(3);
  });

  it('renders ALL projects regardless of `featured` flag (featured=false also appear)', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'featured-one', featured: true, order: 1, year: 2025 }),
      makeProject({ slug: 'not-featured', featured: false, year: 2024 }),
    ];
    const html = await renderContent({ projects });
    expect(html).toMatch(/href="\/cv\/projects\/featured-one"/);
    expect(html).toMatch(/href="\/cv\/projects\/not-featured"/);
  });

  it('orders case studies by year descending (2025 before 2024 before 2023)', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'old-2023', featured: true, order: 3, year: 2023 }),
      makeProject({ slug: 'mid-2024', featured: true, order: 2, year: 2024 }),
      makeProject({ slug: 'fresh-2025', featured: true, order: 1, year: 2025 }),
    ];
    const html = await renderContent({ projects });
    const fresh = html.indexOf('fresh-2025');
    const mid = html.indexOf('mid-2024');
    const old = html.indexOf('old-2023');
    expect(fresh).toBeGreaterThan(-1);
    expect(mid).toBeGreaterThan(-1);
    expect(old).toBeGreaterThan(-1);
    expect(fresh).toBeLessThan(mid);
    expect(mid).toBeLessThan(old);
  });
});
