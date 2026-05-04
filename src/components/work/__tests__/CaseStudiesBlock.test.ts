import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import CaseStudiesBlock from '@/components/work/CaseStudiesBlock.astro';
import type { Project } from '@/lib/schemas/projects';

async function renderBlock(projects: Project[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CaseStudiesBlock, { props: { projects } });
}

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug'>): Project {
  const base: Project = {
    slug: overrides.slug,
    title: { es: overrides.slug, en: overrides.slug },
    company: 'Acme',
    year: 2025,
    featured: false,
    tagline: { es: 'tag-es', en: 'tag-en' },
    description: { es: 'd-es', en: 'd-en' },
    cover: './cover.png',
    tags: [],
    eyebrow: { es: 'eyebrow', en: 'eyebrow' },
    stack: ['stack'],
  };
  return { ...base, ...overrides };
}

describe('CaseStudiesBlock (render-test)', () => {
  it('renders nothing when there are zero featured projects', async () => {
    const projects: Project[] = [makeProject({ slug: 'a' }), makeProject({ slug: 'b' })];
    const html = await renderBlock(projects);
    expect(html.trim()).toBe('');
  });

  it('renders nothing when given an empty list of projects', async () => {
    const html = await renderBlock([]);
    expect(html.trim()).toBe('');
  });

  it('renders the featured ProjectCard hero when there is one featured project', async () => {
    const projects: Project[] = [makeProject({ slug: 'hero', featured: true, order: 1 })];
    const html = await renderBlock(projects);
    expect(html).toMatch(/class="[^"]*projectCard/);
    expect(html).toMatch(/class="[^"]*cardFeatured/);
  });

  it('renders both the featured hero and the rest grid when 3 featured projects exist', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'hero', featured: true, order: 1 }),
      makeProject({ slug: 'second', featured: true, order: 2 }),
      makeProject({ slug: 'third', featured: true, order: 3 }),
    ];
    const html = await renderBlock(projects);
    const cardMatches = html.match(/class="[^"]*projectCard/g);
    expect(cardMatches).not.toBeNull();
    if (cardMatches === null) {
      throw new Error('expected card matches');
    }
    expect(cardMatches).toHaveLength(3);
    const featuredMatches = html.match(/class="[^"]*cardFeatured/g);
    expect(featuredMatches).not.toBeNull();
    if (featuredMatches === null) {
      throw new Error('expected one featured card');
    }
    expect(featuredMatches).toHaveLength(1);
  });

  it('places the featured card before the rest grid in document order', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'hero', featured: true, order: 1 }),
      makeProject({ slug: 'second', featured: true, order: 2 }),
    ];
    const html = await renderBlock(projects);
    const featuredIdx = html.search(/class="[^"]*cardFeatured/);
    const gridIdx = html.search(/class="[^"]*projectsGrid/);
    expect(featuredIdx).toBeGreaterThan(-1);
    expect(gridIdx).toBeGreaterThan(-1);
    expect(featuredIdx).toBeLessThan(gridIdx);
  });

  it('ignores non-featured projects entirely (only featured ones appear)', async () => {
    const projects: Project[] = [
      makeProject({ slug: 'hero', featured: true, order: 1 }),
      makeProject({ slug: 'silent' }),
    ];
    const html = await renderBlock(projects);
    expect(html).toContain('hero');
    expect(html).not.toContain('silent');
  });
});
