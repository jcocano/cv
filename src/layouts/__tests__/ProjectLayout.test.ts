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
  order: 3,
  title: { es: 'Separación de Clusters', en: 'Cluster Separation' },
});
const incommers = makeProject({
  slug: 'incommers-nft',
  order: 2,
  title: { es: 'Incommers NFT', en: 'Incommers NFT' },
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
  it('renders the page-aware back-link with default href to home (BASE_URL "/cv/") and `data-back-link` marker', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*href="\/cv\/"/);
  });

  it('emits both home/projects href datasets on the back-link anchor', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-home-href="\/cv\/"/);
    expect(html).toMatch(/<a[^>]*data-back-link[^>]*data-projects-href="\/cv\/projects\/"/);
  });

  it('emits the bilingual home labels visible (no `hidden` attribute) and the projects labels hidden by default', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(
      /<span[^>]*data-back-variant="home"[^>]*lang="es"(?:(?!hidden)[^>])*>Inicio<\/span>/,
    );
    expect(html).toMatch(
      /<span[^>]*data-back-variant="home"[^>]*lang="en"(?:(?!hidden)[^>])*>Home<\/span>/,
    );
    expect(html).toMatch(
      /<span[^>]*data-back-variant="projects"[^>]*lang="es"[^>]*hidden[^>]*>Todos los proyectos<\/span>/,
    );
    expect(html).toMatch(
      /<span[^>]*data-back-variant="projects"[^>]*lang="en"[^>]*hidden[^>]*>All projects<\/span>/,
    );
  });

  it('emits a referrer-aware <script> as a sibling of the back-link to mutate it when document.referrer matches /projects/', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<script[\s\S]*document\.referrer[\s\S]*<\/script>/);
    expect(html).toMatch(/<script[\s\S]*data-back-link[\s\S]*<\/script>/);
    expect(html).toMatch(/<script[\s\S]*data-projects-href[\s\S]*<\/script>/);
  });

  it('does NOT render the legacy "Volver al portfolio / Back to portfolio" copy (replaced by page-aware Inicio/Home + Todos los proyectos/All projects)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toContain('Volver al portfolio');
    expect(html).not.toContain('Back to portfolio');
  });

  it('does NOT render the legacy `href="/cv/#work"` portfolio anchor anywhere in the layout (replaced by page-aware default to home)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toContain('href="/cv/#work"');
  });

  it('renders the project eyebrow with order padded to 2 digits ("01") and bilingual category', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<span[^>]*>01<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>proyecto destacado<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>featured project<\/span>/);
  });

  it('reuses the shared <Eyebrow> component for the project hero eyebrow (regression: feature #17 iter 3 bug 1)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toMatch(/class="[^"]*\bmono\b[^"]*"/);
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>01<\/span>/);
  });

  it('renders the project h1 title with bilingual <span lang="…"> children', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*<span[^>]*lang="es"[^>]*>Made by Apes<\/span>/);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*<span[^>]*lang="en"[^>]*>Made by Apes<\/span>/);
  });

  it('renders the bilingual tagline paragraph from the project frontmatter', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toContain('Plataforma oficial de licencias para BAYC y MAYC.');
    expect(html).toContain('Official licensing platform for BAYC and MAYC.');
  });

  it('does NOT render the legacy "Cliente"/"Client" meta key (iter 4 rediseño hero)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Cliente<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Client<\/span>/);
  });

  it('renders the company name with accent styling (iter 5)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>Yuga Labs<\/span>/);
  });

  it('renders the year inline with the company in a single combined line (iter 5)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    const companyIdx = html.indexOf('>Yuga Labs<');
    const yearIdx = html.indexOf('>2025<');
    expect(companyIdx).toBeGreaterThan(-1);
    expect(yearIdx).toBeGreaterThan(-1);
    expect(companyIdx).toBeLessThan(yearIdx);
    expect(html).toMatch(/<span\s+class="[^"]+"[^>]*>2025<\/span>/);
  });

  it('renders a "/" separator between company and year (iter 5)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
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
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Año<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Year<\/span>/);
  });

  it('does NOT render a ROLE meta key (iter 5: removed; role lives in experience section)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toMatch(/<span[^>]*lang="es"[^>]*>Rol<\/span>/);
    expect(html).not.toMatch(/<span[^>]*lang="en"[^>]*>Role<\/span>/);
    expect(html).not.toContain('Senior Backend &amp; Platform Engineer');
    expect(html).not.toContain('Senior Backend & Platform Engineer');
  });

  it('does NOT render a STACK meta key (iter 5: pills are the only affordance)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).not.toMatch(/>Stack</);
  });

  it('renders one <span> per technology with the literal tech name (iter 5)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<span[^>]*>TypeScript<\/span>/);
    expect(html).toMatch(/<span[^>]*>NestJS<\/span>/);
    expect(html).toMatch(/<span[^>]*>K8s<\/span>/);
    expect(html).toMatch(/<span[^>]*>AWS<\/span>/);
    expect(html).toMatch(/<span[^>]*>GCP<\/span>/);
    expect(html).not.toContain('TypeScript · NestJS');
  });

  it('renders one stack pill per technology (count matches stack.length)', async () => {
    const projectWithThreeTechs = makeProject({
      slug: 'three-tech',
      order: 1,
      stack: ['Solidity', 'Hardhat', 'Next.js'],
    });
    const html = await renderProjectLayout(projectWithThreeTechs, cluster, incommers);
    expect(html).toMatch(/<span[^>]*>Solidity<\/span>/);
    expect(html).toMatch(/<span[^>]*>Hardhat<\/span>/);
    expect(html).toMatch(/<span[^>]*>Next\.js<\/span>/);
  });

  it('groups the back-link and the eyebrow inside a single hero-top wrapper (iter 4 rediseño hero)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    const wrapperRe =
      /<div[^>]*class="[^"]*"[^>]*>[\s\S]*?<a[^>]*data-back-link[\s\S]*?<span[^>]*class="[^"]*_eyebrow_[^"]*"[\s\S]*?<\/span>[\s\S]*?<\/div>/;
    expect(html).toMatch(wrapperRe);
  });

  it('renders the slot (MDX deep-dive body) verbatim inside <main>', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toContain('<p>cuerpo del deep-dive</p>');
  });

  it('renders the next-project nav with bilingual "Anterior/Previous" link to prev when prev is not null', async () => {
    const html = await renderProjectLayout(cluster, incommers, made);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/incommers-nft"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/incommers-nft"[\s\S]*Previous/);
    expect(html).toContain('Incommers NFT');
  });

  it('renders the next-project nav with bilingual "Siguiente/Next" link to next when next is not null', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/incommers-nft"[\s\S]*Siguiente/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/incommers-nft"[\s\S]*Next/);
  });

  it('renders the bilingual title of the linked next project (Incommers NFT in es / Incommers NFT in en)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Incommers NFT<\/span>/);
  });

  it('renders the circular wrap on the prev side when current is the first by order (made-by-apes -> prev=cluster-separation)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/cluster-separation"[\s\S]*Anterior/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/cluster-separation"[\s\S]*Previous/);
  });

  it('renders the circular wrap on the next side when current is the last by order (cluster-separation -> next=made-by-apes)', async () => {
    const html = await renderProjectLayout(cluster, incommers, made);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/made-by-apes"[\s\S]*Siguiente/);
    expect(html).toMatch(/<a[^>]*href="\/cv\/projects\/made-by-apes"[\s\S]*Next/);
  });

  it('does NOT render the bottom nav when both prev and next are null (N <= 1, no peers to rotate to)', async () => {
    const html = await renderProjectLayout(made, null, null);
    expect(html).not.toMatch(/<nav[^>]*aria-label="Project navigation"/);
    expect(html).not.toMatch(/_nextProj_/);
  });

  it('does NOT render the legacy "Todos los proyectos / All projects" fallback inside the bottom nav (circular: never falls back to the portfolio)', async () => {
    const html = await renderProjectLayout(made, cluster, incommers);
    const navMatch = html.match(/<nav[^>]*aria-label="Project navigation"[\s\S]*?<\/nav>/);
    expect(navMatch).not.toBeNull();
    const navHtml = navMatch?.[0] ?? '';
    expect(navHtml).not.toContain('Todos los proyectos');
    expect(navHtml).not.toContain('All projects');
    expect(navHtml).not.toContain('Volver →');
    expect(navHtml).not.toContain('#work');
  });
});
