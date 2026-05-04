import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ProjectRow from '@/components/work/ProjectRow.astro';
import type { Project } from '@/lib/schemas/projects';

async function renderRow(project: Project, baseUrl = '/'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectRow, { props: { project, baseUrl } });
}

const baseProject: Project = {
  slug: 'made-by-apes',
  title: { es: 'Made by Apes', en: 'Made by Apes' },
  company: 'Yuga Labs',
  year: 2025,
  featured: true,
  tagline: {
    es: 'Plataforma oficial de licencias para BAYC / MAYC.',
    en: 'Official licensing platform for BAYC / MAYC.',
  },
  description: { es: 'desc-es', en: 'desc-en' },
  cover: './cover.png',
  tags: ['Licensing', 'On-chain Sync'],
  order: 1,
  eyebrow: { es: 'destacado', en: 'featured' },
  stack: ['TypeScript', 'NestJS'],
};

describe('ProjectRow (render-test)', () => {
  it('wraps the entire row in an anchor pointing to /projects/<slug>', async () => {
    const html = await renderRow(baseProject, '/cv/');
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/made-by-apes"/);
  });

  it('renders the year as plain text inside the row', async () => {
    const html = await renderRow(baseProject);
    expect(html).toContain('2025');
  });

  it('renders the bilingual title with both <span lang="es"> and <span lang="en">', async () => {
    const html = await renderRow(baseProject);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Made by Apes<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Made by Apes<\/span>/);
  });

  it('renders the company name', async () => {
    const html = await renderRow(baseProject);
    expect(html).toContain('Yuga Labs');
  });

  it('renders the bilingual tagline in both languages', async () => {
    const html = await renderRow(baseProject);
    expect(html).toContain('Plataforma oficial de licencias para BAYC / MAYC.');
    expect(html).toContain('Official licensing platform for BAYC / MAYC.');
  });

  it('renders each tag visible in the row', async () => {
    const html = await renderRow(baseProject);
    expect(html).toContain('Licensing');
    expect(html).toContain('On-chain Sync');
  });

  it('does not render an external link icon (these are internal links)', async () => {
    const html = await renderRow(baseProject);
    expect(html).not.toMatch(/target="_blank"/);
  });

  it('builds the href using the provided baseUrl', async () => {
    const html = await renderRow(baseProject, '/cv/');
    expect(html).toMatch(/href="\/cv\/projects\/made-by-apes"/);
    const html2 = await renderRow(baseProject, '/');
    expect(html2).toMatch(/href="\/projects\/made-by-apes"/);
  });
});
