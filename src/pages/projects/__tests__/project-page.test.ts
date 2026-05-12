import mdxRenderer from '@astrojs/mdx/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection, type CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';

import ProjectSlugPage from '@/pages/projects/[...slug].astro';

const MBA_SLUG = '7a4b3c05-879d-4148-87c9-17f1fd81367f';

async function entryForSlug(slug: string): Promise<CollectionEntry<'projects'>> {
  const entries: CollectionEntry<'projects'>[] = await getCollection('projects');
  const found = entries.find((entry) => entry.data.slug === slug);
  if (found === undefined) {
    throw new Error(`expected to find an entry for slug "${slug}"`);
  }
  return found;
}

async function renderSlug(slug: string): Promise<string> {
  const entry = await entryForSlug(slug);
  const container = await AstroContainer.create();
  container.addServerRenderer({ name: '@astrojs/mdx', renderer: mdxRenderer });
  return container.renderToString(ProjectSlugPage, {
    params: { slug },
    props: { entry },
    request: new Request(`http://localhost/cv/projects/${slug}`),
  });
}

describe('pages/projects/[...slug].astro (render-test)', () => {
  it('the projects collection contains the MBA slug', async () => {
    const entries: CollectionEntry<'projects'>[] = await getCollection('projects');
    const slugs = entries.map((entry) => entry.data.slug);
    expect(slugs).toContain(MBA_SLUG);
  });

  it('renders the MBA project page with the project title in <h1>', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*On-Chain Licensing Platform/);
  });

  it('renders the MBA hero meta with company "Yuga Labs" and year 2025', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toContain('Yuga Labs');
    expect(html).toContain('2025');
  });

  it('renders the back-link with the page-aware default href to home (BASE_URL "/")', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*href="\/"/);
  });

  it('emits both home/projects label variants, with the home variant visible and the projects variant hidden by default', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<span[^>]*data-back-variant="home"[^>]*lang="es"[^>]*>Inicio<\/span>/);
    expect(html).toMatch(/<span[^>]*data-back-variant="home"[^>]*lang="en"[^>]*>Home<\/span>/);
    expect(html).toMatch(
      /<span[^>]*data-back-variant="projects"[^>]*lang="es"[^>]*hidden[^>]*>Todos los proyectos<\/span>/,
    );
    expect(html).toMatch(
      /<span[^>]*data-back-variant="projects"[^>]*lang="en"[^>]*hidden[^>]*>All projects<\/span>/,
    );
  });

  it('emits the data-home-href and data-projects-href attributes on the back-link anchor', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-home-href="\/"/);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-projects-href="\/projects\/"/);
  });

  it('emits a referrer-aware <script> alongside the back-link to mutate it when document.referrer matches /projects/', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<script[\s\S]*document\.referrer[\s\S]*<\/script>/);
    expect(html).toMatch(/<script[\s\S]*data-back-link[\s\S]*<\/script>/);
  });

  it('renders the MBA deep-dive sections (contexto and arquitectura)', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toContain('// contexto');
    expect(html).toContain('// context');
    expect(html).toContain('// arquitectura');
    expect(html).toContain('// architecture');
  });

  it('renders the MBA context paragraph in both languages', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toContain('Bored Ape Yacht Club');
    expect(html).toContain('Mutant Ape Yacht Club');
  });

  it('uses the project order to render the eyebrow num (MBA -> 01)', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
  });

  it('does not render any <p><p> double-open in the MBA project page', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).not.toContain('<p><p>');
  });

  it('does not render any empty <p></p> in the MBA project page', async () => {
    const html = await renderSlug(MBA_SLUG);
    expect(html).not.toContain('<p></p>');
  });
});
