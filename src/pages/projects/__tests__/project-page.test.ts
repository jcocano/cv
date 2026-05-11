import mdxRenderer from '@astrojs/mdx/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getCollection, type CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';

import ProjectSlugPage from '@/pages/projects/[...slug].astro';

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
  it('the projects collection contains exactly the expected slug (made-by-apes)', async () => {
    const entries: CollectionEntry<'projects'>[] = await getCollection('projects');
    const slugs = entries.map((entry) => entry.data.slug).sort();
    expect(slugs).toEqual(['made-by-apes']);
  });

  it('renders the made-by-apes project page with the project title in <h1>', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Made by Apes/);
  });

  it('renders the made-by-apes hero meta with company "Yuga Labs" and year 2025', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toContain('Yuga Labs');
    expect(html).toContain('2025');
  });

  it('renders the made-by-apes back-link with the page-aware default href to home (BASE_URL "/")', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*href="\/"/);
  });

  it('emits both home/projects label variants, with the home variant visible and the projects variant hidden by default', async () => {
    const html = await renderSlug('made-by-apes');
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
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-home-href="\/"/);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-projects-href="\/projects\/"/);
  });

  it('emits a referrer-aware <script> alongside the back-link to mutate it when document.referrer matches /projects/', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<script[\s\S]*document\.referrer[\s\S]*<\/script>/);
    expect(html).toMatch(/<script[\s\S]*data-back-link[\s\S]*<\/script>/);
  });

  it('renders all 4 deep-dive sections of made-by-apes (context, impact, decisions, outcome)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toContain('// contexto');
    expect(html).toContain('// context');
    expect(html).toContain('// impacto');
    expect(html).toContain('// impact');
    expect(html).toContain('// decisiones');
    expect(html).toContain('// decisions');
    expect(html).toContain('// resultado');
    expect(html).toContain('// outcome');
  });

  it('renders the made-by-apes context paragraph in both languages', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toContain('BAYC y MAYC son ecosistemas de IP');
    expect(html).toContain('BAYC and MAYC are IP ecosystems');
  });

  it('renders the made-by-apes impact metrics (0 signatures, <1s latency, 100% validity)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toContain('firmas requeridas en auth');
    expect(html).toContain('signatures required for auth');
    expect(html).toContain('latencia de sync on-chain');
    expect(html).toContain('on-chain sync latency');
  });

  it('does NOT render the bottom Project navigation nav when the collection has a single project (no peers to rotate to)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).not.toMatch(/<nav[^>]*aria-label="Project navigation"/);
  });

  it('uses the project order to render the eyebrow num (made-by-apes -> 01)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
  });

  it('does not render any <p><p> double-open in the made-by-apes project page (iter 7)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).not.toContain('<p><p>');
  });

  it('does not render any empty <p></p> in the made-by-apes project page (iter 7)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).not.toContain('<p></p>');
  });
});
