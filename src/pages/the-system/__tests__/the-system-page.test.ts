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

  it('renders an h1 with the bilingual page title (El sistema / The system)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<h1[^>]*>[\s\S]*El sistema[\s\S]*The system/);
  });

  it('sets the document <title> to "The system — Jesús Cocaño"', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<title>The system — Jesús Cocaño<\/title>/);
  });

  it(
    'renders the five top-level wrappers in order: principles → decisions → ' +
      'technical-decisions → foundations → status',
    async () => {
      const html = await renderTheSystemPage();
      const principlesIndex = html.indexOf('id="block-principles"');
      const decisionsIndex = html.indexOf('id="block-decisions"');
      const technicalDecisionsIndex = html.indexOf('id="block-technical-decisions"');
      const foundationsIndex = html.indexOf('id="block-foundations"');
      const statusIndex = html.indexOf('id="block-status"');

      expect(principlesIndex).toBeGreaterThan(-1);
      expect(decisionsIndex).toBeGreaterThan(principlesIndex);
      expect(technicalDecisionsIndex).toBeGreaterThan(decisionsIndex);
      expect(foundationsIndex).toBeGreaterThan(technicalDecisionsIndex);
      expect(statusIndex).toBeGreaterThan(foundationsIndex);
    },
  );

  it(
    'renders the four foundations sub-blocks in order: typography → spacing → ' +
      'ui-primitives → tokens-by-theme (all inside #block-foundations)',
    async () => {
      const html = await renderTheSystemPage();
      const foundationsIndex = html.indexOf('id="block-foundations"');
      const typographyIndex = html.indexOf('id="sub-typography"');
      const spacingIndex = html.indexOf('id="sub-spacing"');
      const uiPrimitivesIndex = html.indexOf('id="sub-ui-primitives"');
      const tokensIndex = html.indexOf('id="sub-tokens-by-theme"');

      expect(foundationsIndex).toBeGreaterThan(-1);
      expect(typographyIndex).toBeGreaterThan(foundationsIndex);
      expect(spacingIndex).toBeGreaterThan(typographyIndex);
      expect(uiPrimitivesIndex).toBeGreaterThan(spacingIndex);
      expect(tokensIndex).toBeGreaterThan(uiPrimitivesIndex);

      // The legacy top-level token / spacing / type / ui-primitive ids no
      // longer exist — they were absorbed into the foundations wrapper.
      expect(html).not.toMatch(/id="block-tokens"/);
      expect(html).not.toMatch(/id="block-typography"/);
      expect(html).not.toMatch(/id="block-spacing"/);
      expect(html).not.toMatch(/id="block-ui-primitives"/);
    },
  );

  it('mounts the PrinciplesList inside the principles block (one entry per JSON principle)', async () => {
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

  it('renders the bilingual principles eyebrow (principles / principios)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>principios<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>principles<\/span>/);
  });

  it('renders the bilingual UI/UX decisions eyebrow (ui/ux in both languages)', async () => {
    const html = await renderTheSystemPage();
    // The eyebrow lives inside #block-decisions; assert it appears within
    // that wrapper specifically (and not, for example, only inside
    // #block-technical-decisions).
    const decisionsBlockMatch = html.match(
      /id="block-decisions"[\s\S]*?id="block-technical-decisions"/,
    );
    expect(decisionsBlockMatch).not.toBeNull();
    if (decisionsBlockMatch === null) {
      throw new Error('expected the decisions block to precede technical-decisions');
    }
    const decisionsHtml = decisionsBlockMatch[0];
    expect(decisionsHtml).toMatch(/<span[^>]*lang="es"[^>]*>ui\/ux<\/span>/);
    expect(decisionsHtml).toMatch(/<span[^>]*lang="en"[^>]*>ui\/ux<\/span>/);
  });

  it('renders the bilingual technical decisions eyebrow (técnico / technical)', async () => {
    const html = await renderTheSystemPage();
    const technicalBlockMatch = html.match(
      /id="block-technical-decisions"[\s\S]*?id="block-foundations"/,
    );
    expect(technicalBlockMatch).not.toBeNull();
    if (technicalBlockMatch === null) {
      throw new Error('expected the technical-decisions block to precede foundations');
    }
    const technicalHtml = technicalBlockMatch[0];
    expect(technicalHtml).toMatch(/<span[^>]*lang="es"[^>]*>técnico<\/span>/);
    expect(technicalHtml).toMatch(/<span[^>]*lang="en"[^>]*>technical<\/span>/);
  });

  it('renders the bilingual foundations eyebrow (foundations / bases)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>bases<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>foundations<\/span>/);
  });

  it('mounts the TokenSwatcher inside the tokens-by-theme sub-block (3 theme-blocks)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/data-theme-preview="dark"/);
    expect(html).toMatch(/data-theme-preview="light"/);
    expect(html).toMatch(/data-theme-preview="paper"/);
  });

  it('mounts the TypeScale (h1-h6 + body + mono ids)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="type-h1"/);
    expect(html).toMatch(/id="type-h6"/);
    expect(html).toMatch(/id="type-body"/);
    expect(html).toMatch(/id="type-mono"/);
  });

  it('mounts the UiGallery (Tag and at least 12 svgs from icons/)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="ui-tag"/);
    expect(html).toMatch(/id="ui-moon-icon"/);
    expect(html).toMatch(/id="ui-sun-icon"/);
  });

  it('mounts the SpacingScale (radius, radius-lg, container)', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="spacing-radius"/);
    expect(html).toMatch(/id="spacing-radius-lg"/);
    expect(html).toMatch(/id="spacing-container"/);
  });

  it('mounts the DecisionsList twice: UI/UX inside #block-decisions, technical inside #block-technical-decisions', async () => {
    const html = await renderTheSystemPage();
    const uiDecisions = designSystemDecisionsSchema.parse(designSystemDecisionsJson);
    const technicalDecisions = designSystemDecisionsSchema.parse(technicalDecisionsJson);

    // UI/UX entries: one h3#decision-<id> per entry in design-system-decisions.json.
    for (const decision of uiDecisions.decisions) {
      expect(html).toMatch(new RegExp(`id="decision-${decision.id}"`));
    }
    // Technical entries: one h3#decision-<id> per entry in technical-decisions.json.
    for (const decision of technicalDecisions.decisions) {
      expect(html).toMatch(new RegExp(`id="decision-${decision.id}"`));
    }
  });

  it('mounts the SiteStatus block with the build-and-runtime heading and skeleton attributes', async () => {
    const html = await renderTheSystemPage();
    expect(html).toMatch(/id="block-status"/);
    // Iteration-2 architecture: the SSR skeleton wraps the <dl> in a
    // <div role="status" aria-busy="true" data-component="site-status">. The
    // values arrive at runtime from the client module, so we only assert
    // structural hooks here.
    expect(html).toMatch(/<div[^>]*data-component="site-status"/);
    expect(html).toMatch(/<div[^>]*aria-busy="true"/);
    expect(html).toMatch(/<div[^>]*role="status"/);
  });
});
