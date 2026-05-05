import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SiteStatus from '@/components/design-system/SiteStatus.astro';

async function renderSiteStatus(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SiteStatus);
}

// Iteration-2 architecture (see docs/learnings_dependencia_circular_site_status.md):
// the component renders a SEMANTIC SKELETON in SSR. It does NOT read the
// filesystem and does NOT receive data via props at SSR time. The values are
// painted at runtime by the client module `src/scripts/site-status.ts` after
// fetching `/cv/status.json`. These tests therefore assert structure +
// accessibility hooks only — never SSR-rendered values.
describe('SiteStatus (render-test) — bilingual SSR skeleton', () => {
  it('renders a wrapper with role="status", aria-busy="true" and aria-live="polite"', async () => {
    // The <dl> itself does NOT take role="status" because that overrides its
    // implicit list role and trips axe-core's "dlitem" rule. Instead a wrapper
    // <div role="status"> hosts the live region while the inner <dl> stays
    // purely semantic.
    const html = await renderSiteStatus();
    expect(html).toMatch(/<div[^>]*role="status"/);
    expect(html).toMatch(/<div[^>]*aria-busy="true"/);
    expect(html).toMatch(/<div[^>]*aria-live="polite"/);
  });

  it('keeps <dt> and <dd> as direct children of <dl> (axe-core "dlitem" rule)', async () => {
    const html = await renderSiteStatus();
    expect(html).toMatch(/<dl[^>]*>\s*<dt/);
  });

  it('marks the wrapper with data-component="site-status" so the client module can locate it', async () => {
    const html = await renderSiteStatus();
    expect(html).toMatch(/<div[^>]*data-component="site-status"/);
  });

  it('renders seven rows, each with id="status-row-<key>" matching the legacy ids', async () => {
    const html = await renderSiteStatus();
    expect(html).toMatch(/id="status-row-build"/);
    expect(html).toMatch(/id="status-row-deployed"/);
    expect(html).toMatch(/id="status-row-schema"/);
    expect(html).toMatch(/id="status-row-page-weight"/);
    expect(html).toMatch(/id="status-row-js-payload"/);
    expect(html).toMatch(/id="status-row-css-payload"/);
    expect(html).toMatch(/id="status-row-routes"/);
  });

  it('renders seven <dd> elements, one per metric, each with the correct data-status-key attribute', async () => {
    const html = await renderSiteStatus();
    expect(html).toMatch(/<dd[^>]*data-status-key="build_sha"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="build_time"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="schema_version"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="page_weight_kb"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="js_payload_kb"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="css_payload_kb"/);
    expect(html).toMatch(/<dd[^>]*data-status-key="routes_count"/);
  });

  it('renders exactly seven <dt> labels and seven <dd> cells', async () => {
    const html = await renderSiteStatus();
    const dtMatches = html.match(/<dt[\s>]/g);
    const ddMatches = html.match(/<dd[\s>]/g);
    expect(dtMatches).not.toBeNull();
    expect(ddMatches).not.toBeNull();
    if (dtMatches === null || ddMatches === null) {
      throw new Error('expected dt/dd to render');
    }
    expect(dtMatches).toHaveLength(7);
    expect(ddMatches).toHaveLength(7);
  });

  it('renders bilingual labels with <span lang="es"> and <span lang="en"> for every row', async () => {
    const html = await renderSiteStatus();
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Build<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Deployed<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Schema<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Page weight<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>JS payload<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>CSS payload<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Routes<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Build<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Desplegado<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Schema<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Peso de página<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Peso JS<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Peso CSS<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Rutas<\/span>/);
  });

  it('renders bilingual loading copy inside each <dd> so the component degrades gracefully without JS', async () => {
    const html = await renderSiteStatus();
    // The English loading label appears at least seven times — once per <dd>.
    const enLoadingMatches = html.match(/<span[^>]*lang="en"[^>]*>Loading status…<\/span>/g);
    expect(enLoadingMatches).not.toBeNull();
    if (enLoadingMatches === null) {
      throw new Error('expected English loading copy to render');
    }
    expect(enLoadingMatches.length).toBeGreaterThanOrEqual(7);

    const esLoadingMatches = html.match(/<span[^>]*lang="es"[^>]*>Cargando estado…<\/span>/g);
    expect(esLoadingMatches).not.toBeNull();
    if (esLoadingMatches === null) {
      throw new Error('expected Spanish loading copy to render');
    }
    expect(esLoadingMatches.length).toBeGreaterThanOrEqual(7);
  });

  it('does NOT read the filesystem in SSR (no fs imports leak into the rendered HTML)', async () => {
    // Defensive: the SSR output must not embed paths or stack traces from a
    // filesystem read attempt. Iteration-1 inlined `fs.readFileSync` in the
    // frontmatter; iteration-2 forbids that entirely.
    const html = await renderSiteStatus();
    expect(html).not.toMatch(/fs\.readFileSync/);
    expect(html).not.toMatch(/site-status\.json/);
    expect(html).not.toMatch(/data-site-status="(ready|missing)"/);
  });
});
