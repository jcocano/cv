import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TheSystemPage from '@/pages/the-system/index.astro';
import principlesJson from '@/data/principles.json';
import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import technicalDecisionsJson from '@/data/technical-decisions.json';
import { principlesSchema } from '@/lib/schemas/principles';
import { designSystemDecisionsSchema } from '@/lib/schemas/design-system-decisions';

async function renderTheSystemPage(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TheSystemPage, {
    request: new Request('http://localhost/cv/the-system/'),
  });
}

describe('pages/the-system/index.astro (render-test)', () => {
  it('renders within BaseLayout (full <html> + <main id="main"> + nav)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<html[^>]*data-theme="dark"[^>]*data-lang="es"/);
    expect(html).toMatch(/<main[^>]*id="main"/);
  });

  it('renders an h1 with the bilingual page title (El sistema. / The system.)', async () => {
    const html = await renderTheSystemPage();
    // Two separate spans for the bilingual title; never concatenated, never
    // styled with display:block inline.
    expect(html).toMatch(/<h1[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>El sistema\.<\/span>/);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*?<span[^>]*lang="en"[^>]*>The system\.<\/span>/);
  });

  it('sets the document <title> to "The system: Jesús Cocaño"', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<title>The system: Jesús Cocaño<\/title>/);
  });

  it('renders the five top-level sections in order: #why → #how → #what → #tokens → #build', async () => {
    const html = await renderTheSystemPage();
    const whyIndex = html.indexOf('id="why"');
    const howIndex = html.indexOf('id="how"');
    const whatIndex = html.indexOf('id="what"');
    const tokensIndex = html.indexOf('id="tokens"');
    const buildIndex = html.indexOf('id="build"');
    expect(whyIndex).toBeGreaterThan(-1);
    expect(howIndex).toBeGreaterThan(whyIndex);
    expect(whatIndex).toBeGreaterThan(howIndex);
    expect(tokensIndex).toBeGreaterThan(whatIndex);
    expect(buildIndex).toBeGreaterThan(tokensIndex);
  });

  it('drops the legacy block ids (#block-principles / #block-decisions / #block-foundations / #block-status)', async () => {
    const html = await renderTheSystemPage();
    expect(html).not.toMatch(/id="block-principles"/);
    expect(html).not.toMatch(/id="block-decisions"/);
    expect(html).not.toMatch(/id="block-technical-decisions"/);
    expect(html).not.toMatch(/id="block-foundations"/);
    expect(html).not.toMatch(/id="block-status"/);
  });

  it('renders the hero with bilingual eyebrow (handbook técnico / technical handbook)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>handbook técnico<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>technical handbook<\/span>/);
  });

  it('hero <header> shares the section-inner left axis: full-bleed wrapper + container child', async () => {
    // Regression guard for feature #46. The hero must NOT carry the global
    // `class="container"` itself (that centers the wrapper via max-width +
    // margin: 0 auto, shortens its border-bottom and drifts the eyebrow/h1
    // off the section-inner left axis). Instead the hero is a full-bleed
    // <header> with an inner <div class="container ..."> wrapper, mirroring
    // the <section> > <div class="container section-inner"> pattern below.
    const html = await renderTheSystemPage();
    const headerOpen = html.match(/<header\b[^>]*>/);
    expect(headerOpen).not.toBeNull();
    if (headerOpen === null) {
      throw new Error('expected a <header> tag in the hero');
    }
    // The <header> tag itself MUST NOT include the global `container` class.
    expect(headerOpen[0]).not.toMatch(/\bclass="[^"]*\bcontainer\b[^"]*"/);
    // And the <header> MUST contain a child wrapper that DOES carry `container`
    // (the inner column that aligns with .section-inner below).
    const headerEndIndex = html.indexOf('</header>');
    expect(headerEndIndex).toBeGreaterThan(-1);
    const headerOpenIndex = html.indexOf(headerOpen[0]);
    const headerInner = html.slice(headerOpenIndex + headerOpen[0].length, headerEndIndex);
    expect(headerInner).toMatch(/<div\b[^>]*class="[^"]*\bcontainer\b[^"]*"/);
  });

  it('renders the hero meta-row with three layer cells + a last-build cell', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>capa 01<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>layer 01<\/span>/);
    expect(html).toMatch(/data-meta-cell="last-build"/);
  });

  it('renders the five pillar-tags in document order (one per section)', async () => {
    const html = await renderTheSystemPage();
    const pillars = html.match(/data-pillar-tag="(why|how|what|tokens|build)"/g);
    expect(pillars).not.toBeNull();
    if (pillars === null) {
      throw new Error('expected five pillar-tag markers');
    }
    expect(pillars).toHaveLength(5);
  });

  it('renders the bilingual pillar-tag for #why ("01 · POR QUÉ" / "01 · WHY")', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>01 · POR QUÉ<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>01 · WHY<\/span>/);
  });

  it('renders the SubNav (anchors to #why, #how, #what, #tokens, #build)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/data-component="the-system-subnav"/);
    for (const href of ['#why', '#how', '#what', '#tokens', '#build']) {
      expect(html).toMatch(new RegExp(`href="${href.replace('#', '#')}"`));
    }
  });

  it('mounts the PrinciplesList inside #why (one entry per JSON principle)', async () => {
    const html = await renderTheSystemPage();
    const parsed = principlesSchema.parse(principlesJson);
    const entries = html.match(/<article[^>]*data-principle-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected principle entries to render');
    }
    expect(entries).toHaveLength(parsed.principles.length);
    for (const principle of parsed.principles) {
      expect(html).toMatch(new RegExp(`id="${principle.id}"`));
    }
  });

  it('mounts the DecisionsList twice in #how: ux-grid (UI/UX) and technical-list (technical)', async () => {
    const html = await renderTheSystemPage();
    const uxDecisions = designSystemDecisionsSchema.parse(designSystemDecisionsJson);
    const technicalDecisions = designSystemDecisionsSchema.parse(technicalDecisionsJson);
    expect(html).toMatch(/data-variant="ux-grid"/);
    expect(html).toMatch(/data-variant="technical-list"/);

    for (const decision of uxDecisions.decisions) {
      expect(html).toMatch(new RegExp(`id="decision-${decision.id}"`));
    }
    for (const decision of technicalDecisions.decisions) {
      expect(html).toMatch(new RegExp(`id="decision-${decision.id}"`));
    }
  });

  it('renders the bilingual sub-heads for the two decisions sub-blocks (UX / Technical)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>02\.A · UX e interfaz<\/span>/);
    // & is rendered as the HTML entity &amp; in attribute-free body text.
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>02\.A · UX (&|&amp;) interface<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>02\.B · Técnicas<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>02\.B · Technical<\/span>/);
  });

  it('mounts TypeScale, SpacingScale and UiGallery inside #what', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="type-h1"/);
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="ui-tag"/);
    // Section 03.x sub-section markers exist (renumbered to 03.1, 03.2, 03.3).
    expect(html).toMatch(/data-sub-section="typography"/);
    expect(html).toMatch(/data-sub-section="spacing"/);
    expect(html).toMatch(/data-sub-section="ui-primitives"/);
  });

  it('mounts TokensTable inside #tokens (no leftover TokenSwatcher)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<table[^>]*data-component="tokens-table"/);
    // The pre-refactor swatcher with three theme blocks must be gone.
    expect(html).not.toMatch(/data-theme-preview="dark"/);
    expect(html).not.toMatch(/data-theme-preview="light"/);
    expect(html).not.toMatch(/data-theme-preview="paper"/);
  });

  it('mounts SiteStatus inside #build with the stats layout marker', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<div[^>]*data-component="site-status"/);
    expect(html).toMatch(/data-layout="stats"/);
  });

  it('NEVER renders inline style="display:block" on a <span lang> (bilingual hard rule)', async () => {
    const html = await renderTheSystemPage();
    // Reads the entire HTML and asserts that no <span lang="…"> carries an
    // inline style that overrides display. The global rule in base.css:39-42
    // hides the inactive language; an inline display would defeat it.
    expect(html).not.toMatch(/<span[^>]*lang="(es|en)"[^>]*style="[^"]*display\s*:/);
  });

  it('with data-lang="es" the HTML never carries an EN-only string outside lang="en" wrappers', async () => {
    const html = await renderTheSystemPage();
    // The pillar-tag for #why ("01 · WHY") is EN-only and must always live
    // inside <span lang="en">. The pair "01 · POR QUÉ" is ES-only.
    const enOnlySamples = ['01 · WHY', '02 · HOW', '03 · WHAT'];
    const esOnlySamples = ['01 · POR QUÉ', '02 · CÓMO', '03 · QUÉ'];
    for (const sample of enOnlySamples) {
      const pattern = new RegExp(
        `<span[^>]*lang="en"[^>]*>${sample.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/span>`,
      );
      expect(html).toMatch(pattern);
    }
    for (const sample of esOnlySamples) {
      const pattern = new RegExp(
        `<span[^>]*lang="es"[^>]*>${sample.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/span>`,
      );
      expect(html).toMatch(pattern);
    }
  });
});
