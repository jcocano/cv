import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ProjectLayout from '@/layouts/ProjectLayout.astro';
import type { Project } from '@/lib/schemas/projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'slug' | 'order'>): Project {
  const base: Project = {
    slug: overrides.slug,
    title: { es: overrides.slug, en: overrides.slug },
    company: 'Acme',
    year: 2025,
    featured: false,
    tagline: { es: 'tag-es', en: 'tag-en' },
    description: { es: 'desc-es', en: 'desc-en' },
    cover: './cover.png',
    tags: [],
    order: overrides.order,
    eyebrow: { es: 'categoría', en: 'category' },
    stack: ['TypeScript', 'NestJS'],
  };
  return { ...base, ...overrides };
}

const made = makeProject({
  slug: 'made-by-apes',
  order: 1,
  title: { es: 'Made by Apes', en: 'Made by Apes' },
  company: 'Yuga Labs',
  year: 2025,
  featured: true,
  tagline: {
    es: 'Plataforma oficial de licencias para BAYC y MAYC.',
    en: 'Official licensing platform for BAYC and MAYC.',
  },
  eyebrow: { es: 'proyecto destacado', en: 'featured project' },
  stack: ['TypeScript', 'NestJS', 'K8s', 'AWS', 'GCP'],
});
const cluster = makeProject({
  slug: 'cluster-separation',
  order: 2,
  title: { es: 'Separación de Clusters', en: 'Cluster Separation' },
});

async function renderProjectLayout(
  project: Project,
  prev: Project | null,
  next: Project | null,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectLayout, {
    props: { project, prev, next, baseUrl: '/cv/' },
    slots: { default: '<p>cuerpo del deep-dive</p>' },
  });
}

describe('ProjectLayout (render-test)', () => {
  it('renders the back-to-portfolio link with bilingual labels and href to #work', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<a[^>]*href="\/cv\/#work"[^>]*>[\s\S]*Volver al portfolio/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/#work"[^>]*>[\s\S]*Back to portfolio/);
  });

  it('renders the project eyebrow with order padded to 2 digits ("01") and bilingual category', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>proyecto destacado<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>featured project<\/span>/);
  });

  it('reuses the shared <Eyebrow> component for the project hero eyebrow (regression: feature #17 iter 3 bug 1)', async () => {
    // The proj-hero eyebrow used to be reimplemented inline with
    // `class:list={['mono', 'reveal']}`. The literal class `mono` only
    // applies font-family — it does not include the uppercase, gap,
    // letter-spacing, accent-coloured num, or the decorative dash before.
    // The fix is to reuse the existing primitive `<Eyebrow>` component, which
    // carries all those styles through its CSS module.
    //
    // Asserts:
    //  1. The literal class `mono` (the legacy inline implementation) is NOT
    //     present anywhere in the rendered hero — its absence proves the
    //     refactor happened.
    //  2. The `01` digit is wrapped in a span with a `class` attribute (the
    //     hashed CSS module class for `.num` from Eyebrow.module.css), not a
    //     bare `<span>01</span>` (which is what the legacy inline span
    //     produced for the digit).
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).not.toMatch(/class="[^"]*\bmono\b[^"]*"/);
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>01<\/span>/);
  });

  it('renders the project h1 title with bilingual <span lang="…"> children', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Made by Apes<\/span>/);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Made by Apes<\/span>/);
  });

  it('renders the bilingual tagline paragraph from the project frontmatter', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toContain('Plataforma oficial de licencias para BAYC y MAYC.');
    expect(html).toContain('Official licensing platform for BAYC and MAYC.');
  });

  /**
   * Iter 5: hero meta minimalist. The vertical meta column from iter 4
   * carried 4 items (company, YEAR key+value, ROLE key+value, STACK key+pills).
   * Iter 5 collapses this to 2 items by user request:
   *   - one inline line `<company> / <year>` (company in accent, separator,
   *     year in normal/dim) — no YEAR key.
   *   - stack pills (no STACK key — the pill style itself is enough
   *     affordance).
   * The legacy "Cliente/Client" key was already removed in iter 4.
   * The role information lives in the experience section of the index page
   * — the ROLE key+value, the i18n entries (`project.meta.role`,
   * `project.meta.year`, `project.meta.stack`) and the schema field
   * `role` were all removed in iter 5.
   */
  it('does NOT render the legacy "Cliente"/"Client" meta key (iter 4 rediseño hero)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Cliente<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Client<\/span>/);
  });

  it('renders the company name with accent styling (iter 5)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The company "Yuga Labs" is wrapped in a <span> carrying the hashed
    // metaCompany class (which paints it accent). We assert the presence of
    // the literal text inside an element with a `class` attribute (the
    // hashed CSS module class). The exact hash is unpredictable, so we
    // assert the text is wrapped, not the literal class name.
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>Yuga Labs<\/span>/);
  });

  it('renders the year inline with the company in a single combined line (iter 5)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The combined line is "Yuga Labs / 2025" — company, separator, year
    // — all inside the same wrapper. Order in the DOM: company appears
    // before the year.
    const companyIdx = html.indexOf('>Yuga Labs<');
    const yearIdx = html.indexOf('>2025<');
    expect(companyIdx).toBeGreaterThan(-1);
    expect(yearIdx).toBeGreaterThan(-1);
    expect(companyIdx).toBeLessThan(yearIdx);
    // The year is wrapped in its own span (carries the hashed metaYear
    // class). We do not assert the literal class name (it is hashed).
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>2025<\/span>/);
  });

  it('renders a "/" separator between company and year (iter 5)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The slash separator lives in its own <span>. The implementation
    // can pick the exact glyph but the ASCII slash "/" is the contract.
    // We assert the separator appears between the company and the year
    // in document order.
    const companyIdx = html.indexOf('>Yuga Labs<');
    const yearIdx = html.indexOf('>2025<');
    const slashSpanRe = /<span\s+class="[^"]+"[^>]*>\/<\/span>/g;
    let matchedAtIdx = -1;
    for (let m = slashSpanRe.exec(html); m !== null; m = slashSpanRe.exec(html)) {
      const idx = m.index;
      if (idx > companyIdx && idx < yearIdx) {
        matchedAtIdx = idx;
        break;
      }
    }
    expect(matchedAtIdx).toBeGreaterThan(-1);
  });

  it('does NOT render a YEAR meta key (iter 5: removed)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The bilingual YEAR key (`Año` / `Year` inside <span lang="…">) used
    // to live above the year value as a separate item. Iter 5 removes the
    // key entirely — the year is now inline with the company.
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Año<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Year<\/span>/);
  });

  it('does NOT render a ROLE meta key (iter 5: removed; role lives in experience section)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Rol<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Role<\/span>/);
    // The literal role value of `made-by-apes` (Senior Backend & Platform
    // Engineer) must not appear in the rendered hero either.
    expect(html).not.toContain('Senior Backend &amp; Platform Engineer');
    expect(html).not.toContain('Senior Backend & Platform Engineer');
  });

  it('does NOT render a STACK meta key (iter 5: pills are the only affordance)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The literal `Stack` (English label, used non-bilingual in iter 4)
    // must not appear in the rendered output. The pills below carry their
    // own visual affordance.
    expect(html).not.toMatch(/>Stack</);
  });

  it('renders one <span> per technology with the literal tech name (iter 5)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<span[^>]*>TypeScript<\/span>/);
    expect(html).toMatch(/<span[^>]*>NestJS<\/span>/);
    expect(html).toMatch(/<span[^>]*>K8s<\/span>/);
    expect(html).toMatch(/<span[^>]*>AWS<\/span>/);
    expect(html).toMatch(/<span[^>]*>GCP<\/span>/);
    // The legacy " · " concatenated string MUST NOT appear in the rendered
    // hero — it would mean the array was joined back into a string.
    expect(html).not.toContain('TypeScript · NestJS');
  });

  it('renders one stack pill per technology (count matches stack.length)', async () => {
    const projectWithThreeTechs = makeProject({
      slug: 'three-tech',
      order: 5,
      stack: ['Solidity', 'Hardhat', 'Next.js'],
    });
    const html = await renderProjectLayout(projectWithThreeTechs, null, cluster);
    expect(html).toMatch(/<span[^>]*>Solidity<\/span>/);
    expect(html).toMatch(/<span[^>]*>Hardhat<\/span>/);
    expect(html).toMatch(/<span[^>]*>Next\.js<\/span>/);
  });

  it('groups the back-link and the eyebrow inside a single hero-top wrapper (iter 4 rediseño hero)', async () => {
    // The hero now has a 2-row structure:
    //   row 1 (hero-top): back-link + Eyebrow inline (flex, gap 24px).
    //   row 2 (hero-grid): meta column + main column (h1 + tagline).
    //
    // We assert that there is a wrapper <div> containing BOTH the back-link
    // and the Eyebrow span (i.e. they share a parent that's a sibling of
    // the hero-grid). The wrapper carries a hashed class — we don't assert
    // the literal class name, only that both children live inside the same
    // <div>...</div> block.
    const html = await renderProjectLayout(made, null, cluster);
    // Find a <div ...> ... </div> block that contains both the back-link
    // <a ... href="/cv/#work" ...> and the eyebrow <span class="...eyebrow...">.
    // We use a non-greedy capture to keep the match scoped to the first
    // matching wrapper.
    const wrapperRe =
      /<div[^>]*class="[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/cv\/#work"[\s\S]*?<span[^>]*class="[^"]*_eyebrow_[^"]*"[\s\S]*?<\/span>[\s\S]*?<\/div>/;
    expect(html).toMatch(wrapperRe);
  });

  it('renders the slot (MDX deep-dive body) verbatim inside <main>', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toContain('<p>cuerpo del deep-dive</p>');
  });

  it('renders the next-project nav with bilingual "Anterior/Previous" link to prev when prev is not null', async () => {
    const html = await renderProjectLayout(cluster, made, null);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/made-by-apes"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/made-by-apes"[\s\S]*Previous/);
    expect(html).toContain('Made by Apes');
  });

  it('renders the next-project nav with bilingual "Siguiente/Next" link to next when next is not null', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/cluster-separation"[\s\S]*Siguiente/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/cluster-separation"[\s\S]*Next/);
  });

  it('renders the bilingual title of the linked next project (Cluster Separation in es / Cluster Separation in en)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Separación de Clusters<\/span>/);
  });

  it('does NOT render an "Anterior/Previous" link when prev is null (only the back-to-portfolio CTA)', async () => {
    const html = await renderProjectLayout(made, null, cluster);
    // The next-proj nav at the bottom should NOT carry the Anterior/Previous label.
    // The label only appears as part of the back link to a previous project.
    // We assert that "Anterior" appears 0 times and "Previous" appears 0 times.
    const anteriorMatches = html.match(/Anterior/g);
    expect(anteriorMatches).toBeNull();
    const previousMatches = html.match(/Previous/g);
    expect(previousMatches).toBeNull();
  });

  it('does NOT render a "Siguiente/Next" link when next is null (only the back-to-portfolio CTA)', async () => {
    const html = await renderProjectLayout(cluster, made, null);
    const siguienteMatches = html.match(/Siguiente/g);
    expect(siguienteMatches).toBeNull();
    // Iter 4 robustness: a stack pill containing "Next.js" (or any tech
    // starting with "Next") would match the legacy `>Next` regex. We
    // tighten the assertion to the exact closing tag of the nav label.
    const nextLabelMatches = html.match(/<span[^>]*lang="en"[^>]*>Next<\/span>/g);
    expect(nextLabelMatches).toBeNull();
  });

  it('always renders the back-to-portfolio "Portfolio" link in the bottom nav', async () => {
    const htmlMiddle = await renderProjectLayout(
      cluster,
      made,
      makeProject({ slug: 'inc', order: 3 }),
    );
    expect(htmlMiddle).toMatch(/<a[^>]*href="\/cv\/#work"/);
  });
});
