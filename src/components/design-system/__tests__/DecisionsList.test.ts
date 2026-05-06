import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import DecisionsList from '@/components/design-system/DecisionsList.astro';
import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import technicalDecisionsJson from '@/data/technical-decisions.json';
import { computeCardEyebrow } from '@/lib/the-system/card-eyebrow';
import {
  designSystemDecisionsSchema,
  type DesignSystemDecisions,
} from '@/lib/schemas/design-system-decisions';

type DecisionsSource = 'ui' | 'technical';
type DecisionsVariant = 'ux-grid' | 'technical-list';

async function renderDecisionsList(args: {
  source: DecisionsSource;
  variant: DecisionsVariant;
}): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(DecisionsList, {
    props: { source: args.source, variant: args.variant },
  });
}

const UI_DECISIONS: DesignSystemDecisions =
  designSystemDecisionsSchema.parse(designSystemDecisionsJson);
const TECHNICAL_DECISIONS: DesignSystemDecisions =
  designSystemDecisionsSchema.parse(technicalDecisionsJson);

describe('DecisionsList — variant: "ux-grid" (UI/UX decisions, source: "ui")', () => {
  it('renders one entry per decision in src/data/design-system-decisions.json', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    const entries = html.match(/<article[^>]*data-decision-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected decision entries to render');
    }
    expect(entries).toHaveLength(UI_DECISIONS.decisions.length);
  });

  it('renders an h3 with id="decision-<id>" for every decision (namespace decision-)', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    for (const decision of UI_DECISIONS.decisions) {
      expect(html).toMatch(new RegExp(`<h3[^>]*id="decision-${decision.id}"`));
    }
  });

  it('renders both Spanish and English title for each decision in <span lang>', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    for (const decision of UI_DECISIONS.decisions) {
      expect(html).toContain(decision.title.es);
      expect(html).toContain(decision.title.en);
    }
  });

  it('renders a card-eyebrow with the computed D.NN order + bilingual eyebrow text from JSON', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    UI_DECISIONS.decisions.forEach((decision, index) => {
      const expectedNum = computeCardEyebrow('D', index);
      expect(html).toContain(expectedNum);
      const eyebrow = decision.eyebrow;
      if (eyebrow !== undefined) {
        expect(html).toMatch(
          new RegExp(
            `<span[^>]*lang="es"[^>]*>${eyebrow.es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</span>`,
          ),
        );
        expect(html).toMatch(
          new RegExp(
            `<span[^>]*lang="en"[^>]*>${eyebrow.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</span>`,
          ),
        );
      }
    });
  });

  it('renders the variant data-attribute on the wrapper for css-module hooks', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    expect(html).toMatch(/data-variant="ux-grid"/);
  });

  it('does NOT render an "Alternatives considered" section in the UX variant (no alternatives expected)', async () => {
    const html = await renderDecisionsList({ source: 'ui', variant: 'ux-grid' });
    expect(html).not.toMatch(/data-alternatives-rejected/);
    expect(html).not.toMatch(/Alternativas consideradas/);
    expect(html).not.toMatch(/Alternatives considered/);
  });
});

describe('DecisionsList — variant: "technical-list" (technical decisions, source: "technical")', () => {
  it('renders one entry per decision in src/data/technical-decisions.json', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    const entries = html.match(/<article[^>]*data-decision-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected decision entries to render');
    }
    expect(entries).toHaveLength(TECHNICAL_DECISIONS.decisions.length);
  });

  it('renders an h3 with id="decision-<id>" for every technical decision', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    for (const decision of TECHNICAL_DECISIONS.decisions) {
      expect(html).toMatch(new RegExp(`<h3[^>]*id="decision-${decision.id}"`));
    }
  });

  it('renders both rationales (es + en) for each technical decision', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    for (const decision of TECHNICAL_DECISIONS.decisions) {
      expect(html).toContain(decision.rationale.es);
      expect(html).toContain(decision.rationale.en);
    }
  });

  it('renders a card-eyebrow with the computed T.NN order for each entry', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    TECHNICAL_DECISIONS.decisions.forEach((_, index) => {
      const expectedNum = computeCardEyebrow('T', index);
      expect(html).toContain(expectedNum);
    });
  });

  it('renders the variant data-attribute on the wrapper for css-module hooks', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    expect(html).toMatch(/data-variant="technical-list"/);
  });

  it('renders <details class="alts"> ONLY when alternatives_rejected is defined', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    const withAlternatives = TECHNICAL_DECISIONS.decisions.filter(
      (decision) => decision.alternatives_rejected !== undefined,
    );
    expect(withAlternatives.length).toBeGreaterThan(0);

    for (const decision of withAlternatives) {
      const alternatives = decision.alternatives_rejected;
      if (alternatives === undefined) {
        throw new Error('filter invariant broken');
      }
      expect(html).toContain(alternatives.es);
      expect(html).toContain(alternatives.en);
      expect(html).toMatch(new RegExp(`data-alternatives-rejected="${decision.id}"`));
    }

    const subBlocks = html.match(/data-alternatives-rejected="/g);
    expect(subBlocks).not.toBeNull();
    if (subBlocks === null) {
      throw new Error('expected at least one alternatives sub-block');
    }
    expect(subBlocks).toHaveLength(withAlternatives.length);
    // The technical-list variant uses a <details> element to collapse alts,
    // matching the refactor mock semantics.
    expect(html).toMatch(
      /<details[^>]*class="[^"]*alts[^"]*"|<details[^>]*data-alternatives-rejected/,
    );
  });

  it('renders the bilingual "Alternatives considered" label inside the <details> summary', async () => {
    const html = await renderDecisionsList({ source: 'technical', variant: 'technical-list' });
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Alternativas consideradas<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Alternatives considered<\/span>/);
  });
});
