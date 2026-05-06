import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import UiGallery from '@/components/design-system/UiGallery.astro';

async function renderUiGallery(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(UiGallery);
}

const EXPECTED_IDS = [
  'ui-eyebrow',
  'ui-lang',
  'ui-section-head',
  'ui-tag',
  'ui-agents-mcp-icon',
  'ui-assisted-dev-icon',
  'ui-document-icon',
  'ui-email-icon',
  'ui-github-icon',
  'ui-linkedin-icon',
  'ui-llm-backends-icon',
  'ui-moon-icon',
  'ui-paper-icon',
  'ui-repo-icon',
  'ui-sparkle-icon',
  'ui-sun-icon',
];

describe('UiGallery (render-test)', () => {
  it('renders a gallery entry for every component in src/components/ui/ and src/components/ui/icons/', async () => {
    const html = await renderUiGallery();
    for (const id of EXPECTED_IDS) {
      expect(html).toMatch(new RegExp(`data-ui-entry="${id}"`));
    }
  });

  it('splits the gallery into two named sub-groups (primitives + icons) so SectionHead does not stretch every row', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(/data-ui-group="primitives"/);
    expect(html).toMatch(/data-ui-group="icons"/);
  });

  it('places the four direct primitives (Eyebrow, Lang, SectionHead, Tag) inside data-ui-group="primitives"', async () => {
    const html = await renderUiGallery();
    const primitivesMatch = html.match(/data-ui-group="primitives"[\s\S]*?data-ui-group="icons"/);
    expect(primitivesMatch).not.toBeNull();
    if (primitivesMatch === null) {
      throw new Error('expected primitives sub-group to be present');
    }
    const primitivesHtml = primitivesMatch[0];
    expect(primitivesHtml).toMatch(/data-ui-entry="ui-eyebrow"/);
    expect(primitivesHtml).toMatch(/data-ui-entry="ui-lang"/);
    expect(primitivesHtml).toMatch(/data-ui-entry="ui-section-head"/);
    expect(primitivesHtml).toMatch(/data-ui-entry="ui-tag"/);
  });

  it('keeps SectionHead inside the primitives sub-group as a normal cell (no data-ui-span="full" in the refactored layout)', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(/data-ui-entry="ui-section-head"/);
    expect(html).not.toMatch(/data-ui-span="full"/);
  });

  it('places all 12 icon entries inside data-ui-group="icons"', async () => {
    const html = await renderUiGallery();
    const iconsHtml = html.split('data-ui-group="icons"')[1] ?? '';
    const iconIds = [
      'ui-agents-mcp-icon',
      'ui-assisted-dev-icon',
      'ui-document-icon',
      'ui-email-icon',
      'ui-github-icon',
      'ui-linkedin-icon',
      'ui-llm-backends-icon',
      'ui-moon-icon',
      'ui-paper-icon',
      'ui-repo-icon',
      'ui-sparkle-icon',
      'ui-sun-icon',
    ];
    for (const id of iconIds) {
      expect(iconsHtml).toMatch(new RegExp(`data-ui-entry="${id}"`));
    }
  });

  it('renders an h4 with id="ui-<component>" carrying the component name in mono (one level below the ui-primitives h3 sub-block under foundations)', async () => {
    const html = await renderUiGallery();
    for (const id of EXPECTED_IDS) {
      expect(html).toMatch(new RegExp(`<h4[^>]*id="${id}"`));
    }
    for (const id of EXPECTED_IDS) {
      expect(html).not.toMatch(new RegExp(`<h3[^>]*id="${id}"`));
    }
  });

  it('renders a live demo for the Tag primitive (label visible)', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(/data-ui-entry="ui-tag"[\s\S]*Tag preview/);
  });

  it('renders a SectionHead-style demo with a bilingual heading (Sample title / Título de muestra)', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(/data-ui-entry="ui-section-head"/);
    expect(html).toMatch(/Título de muestra/);
    expect(html).toMatch(/Sample title/);
  });

  it('renders an Eyebrow demo with bilingual labels', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(/data-ui-entry="ui-eyebrow"/);
    expect(html).toMatch(/lang="es"[^>]*>muestra/);
    expect(html).toMatch(/lang="en"[^>]*>preview/);
  });

  it('renders the icon entries as inline svg', async () => {
    const html = await renderUiGallery();
    const svgMatches = html.match(/<svg/g);
    expect(svgMatches).not.toBeNull();
    if (svgMatches === null) {
      throw new Error('expected svgs to render');
    }
    expect(svgMatches.length).toBeGreaterThanOrEqual(12);
  });

  it('marks the primitives sub-group with data-grid-shape="spec" and the icons sub-group with data-grid-shape="icons"', async () => {
    const html = await renderUiGallery();
    expect(html).toMatch(
      /data-ui-group="primitives"[^>]*data-grid-shape="spec"|data-grid-shape="spec"[^>]*data-ui-group="primitives"/,
    );
    expect(html).toMatch(
      /data-ui-group="icons"[^>]*data-grid-shape="icons"|data-grid-shape="icons"[^>]*data-ui-group="icons"/,
    );
  });
});
