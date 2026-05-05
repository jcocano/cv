import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import DecisionsList from '@/components/design-system/DecisionsList.astro';
import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import technicalDecisionsJson from '@/data/technical-decisions.json';
import {
  designSystemDecisionsSchema,
  type DesignSystemDecisions,
} from '@/lib/schemas/design-system-decisions';

type DecisionsSource = 'ui' | 'technical';

async function renderDecisionsList(source: DecisionsSource): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(DecisionsList, { props: { source } });
}

const UI_DECISIONS: DesignSystemDecisions =
  designSystemDecisionsSchema.parse(designSystemDecisionsJson);
const TECHNICAL_DECISIONS: DesignSystemDecisions =
  designSystemDecisionsSchema.parse(technicalDecisionsJson);

describe('DecisionsList — source: "ui" (UI/UX decisions)', () => {
  it('renders one entry per decision in src/data/design-system-decisions.json (count-based)', async () => {
    const html = await renderDecisionsList('ui');
    const entries = html.match(/<article[^>]*data-decision-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected decision entries to render');
    }
    expect(entries).toHaveLength(UI_DECISIONS.decisions.length);
  });

  it('renders an h3 with id="decision-<id>" for every decision (namespace decision-)', async () => {
    const html = await renderDecisionsList('ui');
    for (const decision of UI_DECISIONS.decisions) {
      expect(html).toMatch(new RegExp(`<h3[^>]*id="decision-${decision.id}"`));
    }
  });

  it('renders both Spanish and English title for each decision in <span lang>', async () => {
    const html = await renderDecisionsList('ui');
    for (const decision of UI_DECISIONS.decisions) {
      expect(html).toContain(decision.title.es);
      expect(html).toContain(decision.title.en);
    }
  });

  it('renders both Spanish and English rationale for each decision', async () => {
    const html = await renderDecisionsList('ui');
    for (const decision of UI_DECISIONS.decisions) {
      expect(html).toContain(decision.rationale.es);
      expect(html).toContain(decision.rationale.en);
    }
  });

  it('renders the title spans with explicit lang attribute (es / en)', async () => {
    const html = await renderDecisionsList('ui');
    const firstDecision = UI_DECISIONS.decisions[0];
    if (firstDecision === undefined) {
      throw new Error('expected at least one decision in the JSON');
    }
    const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="es"[^>]*>${escapeRegExp(firstDecision.title.es)}</span>`),
    );
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="en"[^>]*>${escapeRegExp(firstDecision.title.en)}</span>`),
    );
  });

  it('does NOT render an "Alternatives considered" section for entries without alternatives_rejected', async () => {
    const html = await renderDecisionsList('ui');
    // None of the UI/UX decisions in src/data/design-system-decisions.json
    // declare `alternatives_rejected`. The sub-block must therefore be
    // entirely absent from the rendered output for the UI source.
    expect(html).not.toMatch(/data-alternatives-rejected/);
    expect(html).not.toMatch(/Alternativas consideradas/);
    expect(html).not.toMatch(/Alternatives considered/);
  });
});

describe('DecisionsList — source: "technical" (technical decisions)', () => {
  it('renders one entry per decision in src/data/technical-decisions.json (count-based)', async () => {
    const html = await renderDecisionsList('technical');
    const entries = html.match(/<article[^>]*data-decision-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected decision entries to render');
    }
    expect(entries).toHaveLength(TECHNICAL_DECISIONS.decisions.length);
  });

  it('renders an h3 with id="decision-<id>" for every technical decision', async () => {
    const html = await renderDecisionsList('technical');
    for (const decision of TECHNICAL_DECISIONS.decisions) {
      expect(html).toMatch(new RegExp(`<h3[^>]*id="decision-${decision.id}"`));
    }
  });

  it('renders both rationales (es + en) for each technical decision', async () => {
    const html = await renderDecisionsList('technical');
    for (const decision of TECHNICAL_DECISIONS.decisions) {
      expect(html).toContain(decision.rationale.es);
      expect(html).toContain(decision.rationale.en);
    }
  });

  it('renders the "Alternatives considered" sub-block ONLY when alternatives_rejected is defined', async () => {
    const html = await renderDecisionsList('technical');
    const withAlternatives = TECHNICAL_DECISIONS.decisions.filter(
      (decision) => decision.alternatives_rejected !== undefined,
    );
    const withoutAlternatives = TECHNICAL_DECISIONS.decisions.filter(
      (decision) => decision.alternatives_rejected === undefined,
    );
    // Sanity: the technical JSON must exercise both branches of the component
    // (at least one entry with alternatives_rejected defined, at least one without).
    expect(withAlternatives.length).toBeGreaterThan(0);
    expect(withoutAlternatives.length).toBeGreaterThan(0);

    for (const decision of withAlternatives) {
      const alternatives = decision.alternatives_rejected;
      if (alternatives === undefined) {
        throw new Error('filter invariant broken: alternatives_rejected expected');
      }
      expect(html).toContain(alternatives.es);
      expect(html).toContain(alternatives.en);
      expect(html).toMatch(new RegExp(`data-alternatives-rejected="${decision.id}"`));
    }

    // Count of sub-block markers must equal number of entries with the field.
    const subBlocks = html.match(/data-alternatives-rejected="/g);
    expect(subBlocks).not.toBeNull();
    if (subBlocks === null) {
      throw new Error('expected at least one alternatives sub-block');
    }
    expect(subBlocks).toHaveLength(withAlternatives.length);
  });

  it('renders the bilingual "Alternatives considered" label (Alternativas consideradas / Alternatives considered)', async () => {
    const html = await renderDecisionsList('technical');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Alternativas consideradas<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Alternatives considered<\/span>/);
  });
});
