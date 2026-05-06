import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TheSystemPage from '@/pages/the-system/index.astro';
import principlesJson from '@/data/principles.json';
import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import technicalDecisionsJson from '@/data/technical-decisions.json';
import { principlesSchema } from '@/lib/schemas/principles';
import { designSystemDecisionsSchema } from '@/lib/schemas/design-system-decisions';

const indexModuleCssPath = fileURLToPath(new URL('../index.module.css', import.meta.url));
const indexModuleCss = readFileSync(indexModuleCssPath, 'utf8');

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

  it('hero h1: the EN <span lang="en"> is NOT muted by the CSS module (bilingual color parity)', () => {
    // Regression guard for feature #47. Before the fix, index.module.css carried
    //   .hero-title [lang='en'] { color: var(--fg-mute); }
    // which made `The system.` (h1 EN) look dimmer than `El sistema.` (h1 ES).
    // The intent of the bilingual refactor (feature #45) was full parity. The
    // muting rule must NOT exist anywhere in the page CSS module.
    expect(indexModuleCss).not.toMatch(/\.hero-title\s+\[lang=['"]en['"]\]/);
    // Stronger guard: the substring `[lang='en']` must not appear in any
    // selector inside the page CSS module (no per-language muting at all).
    expect(indexModuleCss).not.toMatch(/\[lang=['"]en['"]\]/);
  });

  it('section h2 accent: the .title-accent rule does NOT mute the EN span (bilingual color parity)', () => {
    // Regression guard for feature #47. Before the fix, the page CSS module
    // declared `.title-accent { color: var(--fg-mute); }` and applied that
    // class to the EN <span> in #why/#how/#what/#tokens h2 titles (lines 97,
    // 119, 152, 206 of index.astro). Result: `Principles. / Decisions. /
    // Foundations. / Tokens.` looked dimmer than the ES titles. The fix
    // removes both the CSS rule and the `class={styles.titleAccent}` from the
    // markup, leaving only the `<span lang="en">` distinction.
    expect(indexModuleCss).not.toMatch(/\.title-accent\s*\{[^}]*color\s*:\s*var\(--fg-mute\)/);
    // The simplest, most robust form: the rule body for `.title-accent` (if
    // it exists at all) must NOT mention `--fg-mute`. The implementer's
    // chosen path (option a) drops the rule entirely AND drops the class
    // from the four call sites.
    const titleAccentRule = indexModuleCss.match(/\.title-accent\s*\{[^}]*\}/);
    if (titleAccentRule !== null) {
      expect(titleAccentRule[0]).not.toMatch(/--fg-mute/);
    }
  });

  it('renders <BackToHomeLink /> at the top of the hero (bilingual return-home link)', async () => {
    // Acceptance #4 of feature #47. Project pages have a back-to-home link
    // at the top (ProjectsIndexContent) or bottom (ProjectLayout footer);
    // the-system did not have one. This guard checks that the page now
    // renders the bilingual anchor exactly like the other pages do.
    const html = await renderTheSystemPage();
    // Bilingual labels match the literals in i18n/{es,en}.json:
    //   "projects.backToHome": "← Inicio" / "← Home".
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>← Inicio<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>← Home<\/span>/);
    // The link must use the BASE_URL root (resolves to "/" in the test env,
    // and to "/cv/" in production via Astro's `base` config). Same href
    // pattern as the BackToHomeLink unit test (line 15 of its file).
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[\s\S]*?← Inicio[\s\S]*?<\/a>/);
  });

  it('the BackToHomeLink lives ABOVE the hero eyebrow (top-of-page placement, mirrors ProjectsIndexContent)', async () => {
    // Acceptance #4 (revised on 2026-05-05 after user feedback): the link must
    // sit at the very top of the hero, ABOVE the `▲ handbook técnico` eyebrow,
    // not at the end of the page. Pattern matches ProjectsIndexContent.astro
    // (line 19-31): `<div class="container"> <BackToHomeLink /> <SectionHead />`.
    // Here the link is the first child of the hero's inner `<div class="container ...">`,
    // BEFORE the `<p class={styles.heroEyebrow}>` with the bilingual eyebrow.
    // The BackToHomeLink renders a <span lang="es">← Inicio</span>; its index
    // in the HTML must be LESS than the index of the eyebrow text.
    const html = await renderTheSystemPage();
    const inicioIndex = html.indexOf('← Inicio');
    const eyebrowIndex = html.indexOf('handbook técnico');
    const heroHeaderIndex = html.indexOf('<header');
    expect(inicioIndex).toBeGreaterThan(-1);
    expect(eyebrowIndex).toBeGreaterThan(-1);
    expect(heroHeaderIndex).toBeGreaterThan(-1);
    // The link is INSIDE the hero <header> (after its opening tag) but BEFORE
    // the eyebrow `handbook técnico` text. This pins it as the first piece of
    // hero content, mirroring the projects index page.
    expect(inicioIndex).toBeGreaterThan(heroHeaderIndex);
    expect(inicioIndex).toBeLessThan(eyebrowIndex);
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
