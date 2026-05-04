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
  it('the projects collection contains exactly the 3 expected slugs', async () => {
    const entries: CollectionEntry<'projects'>[] = await getCollection('projects');
    const slugs = entries.map((entry) => entry.data.slug).sort();
    expect(slugs).toEqual(['cluster-separation', 'incommers-nft', 'made-by-apes']);
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
    // Default (server-render): the back link points to home `/` and shows the
    // "Inicio / Home" labels. JS at runtime mutates the link to
    // `/projects/` with "Todos los proyectos / All projects" labels when
    // `document.referrer` matches the projects index. The HTML emitted here
    // is the default. BASE_URL in vitest is "/".
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

  it('renders the circular prev=cluster-separation and next=incommers-nft nav for made-by-apes (first by order, wraps prev to last)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<a[^>]*href="\/projects\/cluster-separation"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/cluster-separation"[\s\S]*Previous/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/incommers-nft"[\s\S]*Siguiente/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/incommers-nft"[\s\S]*Next/);
  });

  it('renders the prev=made-by-apes and next=cluster-separation nav for incommers-nft (middle)', async () => {
    const html = await renderSlug('incommers-nft');
    expect(html).toMatch(/<a[^>]*href="\/projects\/made-by-apes"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/made-by-apes"[\s\S]*Previous/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/cluster-separation"[\s\S]*Siguiente/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/cluster-separation"[\s\S]*Next/);
  });

  it('renders the circular prev=incommers-nft and next=made-by-apes nav for cluster-separation (last by order, wraps next to first)', async () => {
    const html = await renderSlug('cluster-separation');
    expect(html).toMatch(/<a[^>]*href="\/projects\/incommers-nft"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/incommers-nft"[\s\S]*Previous/);
    expect(html).toMatch(/<a[^>]*href="\/projects\/made-by-apes"[\s\S]*Siguiente/);
    // Tighten the assertion: a legacy `>Next` regex would match a "Next.js"
    // stack pill. We pin the nav label to the exact closing tag.
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Next<\/span>/);
  });

  it('does not render the legacy "Todos los proyectos / All projects" fallback inside the bottom nav (circular: never falls back to the portfolio)', async () => {
    for (const slug of ['made-by-apes', 'incommers-nft', 'cluster-separation']) {
      const html = await renderSlug(slug);
      // The legacy fallback labels lived inside the nextProj nav when prev or
      // next was null. With circular rotation those branches are gone.
      // The same labels are emitted for the back-link variant, so we narrow
      // the search to the nextProj nav block.
      const navMatch = html.match(/<nav[^>]*aria-label="Project navigation"[\s\S]*?<\/nav>/);
      expect(navMatch).not.toBeNull();
      const navHtml = navMatch?.[0] ?? '';
      expect(navHtml).not.toContain('Todos los proyectos');
      expect(navHtml).not.toContain('All projects');
      expect(navHtml).not.toContain('Volver');
      // No anchor inside the nav points to the portfolio anchor #work.
      expect(navHtml).not.toContain('#work');
    }
  });

  it('uses the project order to render the eyebrow num (made-by-apes -> 01)', async () => {
    const html = await renderSlug('made-by-apes');
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
  });

  /**
   * Regression for feature #17 iter 7 (eliminar wrap espurio <p><p> que MDX
   * genera dentro de <Lang>).
   *
   * Iter 6 introduced a flex column with gap 20px on `.body [lang]` to space
   * sibling <p> children inside a <Lang> wrapper. Visual review revealed
   * unexpected green bands in DevTools around the paragraph: the bundle
   * actually contained `<div lang="en"><p><p>Ship a collection...` because
   * MDX wraps inline whitespace inside <Lang> with an automatic <p>, which
   * then nests around the literal <p> in the .mdx source. The browser
   * auto-closes the outer <p> producing an empty `<p></p>` sibling, and the
   * 20px flex gap falls between the empty <p> and the real one.
   *
   * Iter 7 root-cause fix: rewrite the .mdx so the bilingual content uses
   * markdown prose inside <Lang> (text directly between blank lines) rather
   * than literal <p> tags. Defensive guard: `.body :global(p:empty) {
   * display: none }` in the CSS module.
   *
   * The asserts below pin the contract end-to-end: no rendered project page
   * may contain `<p><p>` (double-open) nor `<p></p>` (empty paragraph) in
   * its HTML output.
   */
  for (const slug of ['made-by-apes', 'cluster-separation', 'incommers-nft']) {
    it(`does not render any <p><p> double-open in the ${slug} project page (iter 7)`, async () => {
      const html = await renderSlug(slug);
      expect(html).not.toContain('<p><p>');
    });

    it(`does not render any empty <p></p> in the ${slug} project page (iter 7)`, async () => {
      const html = await renderSlug(slug);
      expect(html).not.toContain('<p></p>');
    });
  }
});
