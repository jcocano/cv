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
    const html = await renderTheSystemPage();
    const headerOpen = html.match(/<header\b[^>]*>/);
    expect(headerOpen).not.toBeNull();
    if (headerOpen === null) {
      throw new Error('expected a <header> tag in the hero');
    }
    expect(headerOpen[0]).not.toMatch(/\bclass="[^"]*\bcontainer\b[^"]*"/);
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
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>02\.A · UX (&|&amp;) interface<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>02\.B · Técnicas<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>02\.B · Technical<\/span>/);
  });

  it('mounts TypeScale, SpacingScale and UiGallery inside #what', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="type-h1"/);
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="ui-tag"/);
    expect(html).toMatch(/data-sub-section="typography"/);
    expect(html).toMatch(/data-sub-section="spacing"/);
    expect(html).toMatch(/data-sub-section="ui-primitives"/);
  });

  it('mounts TokensTable inside #tokens (no leftover TokenSwatcher)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<table[^>]*data-component="tokens-table"/);
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
    expect(html).not.toMatch(/<span[^>]*lang="(es|en)"[^>]*style="[^"]*display\s*:/);
  });

  it('hero h1: the EN <span lang="en"> is NOT muted by the CSS module (bilingual color parity)', () => {
    expect(indexModuleCss).not.toMatch(/\.hero-title\s+\[lang=['"]en['"]\]/);
    expect(indexModuleCss).not.toMatch(/\[lang=['"]en['"]\]/);
  });

  it('section h2 accent: the .title-accent rule does NOT mute the EN span (bilingual color parity)', () => {
    expect(indexModuleCss).not.toMatch(/\.title-accent\s*\{[^}]*color\s*:\s*var\(--fg-mute\)/);
    const titleAccentRule = indexModuleCss.match(/\.title-accent\s*\{[^}]*\}/);
    if (titleAccentRule !== null) {
      expect(titleAccentRule[0]).not.toMatch(/--fg-mute/);
    }
  });

  it('renders <BackToHomeLink /> at the top of the hero (bilingual return-home link)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>← Inicio<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>← Home<\/span>/);
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[\s\S]*?← Inicio[\s\S]*?<\/a>/);
  });

  it('the BackToHomeLink lives ABOVE the hero eyebrow (top-of-page placement, mirrors ProjectsIndexContent)', async () => {
    const html = await renderTheSystemPage();
    const inicioIndex = html.indexOf('← Inicio');
    const eyebrowIndex = html.indexOf('handbook técnico');
    const heroHeaderIndex = html.indexOf('<header');
    expect(inicioIndex).toBeGreaterThan(-1);
    expect(eyebrowIndex).toBeGreaterThan(-1);
    expect(heroHeaderIndex).toBeGreaterThan(-1);
    expect(inicioIndex).toBeGreaterThan(heroHeaderIndex);
    expect(inicioIndex).toBeLessThan(eyebrowIndex);
  });

  it('with data-lang="es" the HTML never carries an EN-only string outside lang="en" wrappers', async () => {
    const html = await renderTheSystemPage();
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
