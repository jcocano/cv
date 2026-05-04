import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import DecisionsList from '@/components/design-system/DecisionsList.astro';
import designSystemDecisionsJson from '@/data/design-system-decisions.json';
import {
  designSystemDecisionsSchema,
  type DesignSystemDecisions,
} from '@/lib/schemas/design-system-decisions';

async function renderDecisionsList(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(DecisionsList);
}

const PARSED: DesignSystemDecisions = designSystemDecisionsSchema.parse(designSystemDecisionsJson);

describe('DecisionsList (render-test)', () => {
  it('renders one entry per decision in src/data/design-system-decisions.json (count-based)', async () => {
    const html = await renderDecisionsList();
    const entries = html.match(/<article[^>]*data-decision-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected decision entries to render');
    }
    expect(entries).toHaveLength(PARSED.decisions.length);
  });

  it('renders an h3 with id="decision-<id>" for every decision (namespace decision-)', async () => {
    const html = await renderDecisionsList();
    for (const decision of PARSED.decisions) {
      expect(html).toMatch(new RegExp(`<h3[^>]*id="decision-${decision.id}"`));
    }
  });

  it('renders both Spanish and English title for each decision in <span lang>', async () => {
    const html = await renderDecisionsList();
    for (const decision of PARSED.decisions) {
      expect(html).toContain(decision.title.es);
      expect(html).toContain(decision.title.en);
    }
  });

  it('renders both Spanish and English rationale for each decision', async () => {
    const html = await renderDecisionsList();
    for (const decision of PARSED.decisions) {
      expect(html).toContain(decision.rationale.es);
      expect(html).toContain(decision.rationale.en);
    }
  });

  it('renders the title spans with explicit lang attribute (es / en)', async () => {
    const html = await renderDecisionsList();
    const firstDecision = PARSED.decisions[0];
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
});
