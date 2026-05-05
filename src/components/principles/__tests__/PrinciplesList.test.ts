import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import PrinciplesList from '@/components/principles/PrinciplesList.astro';
import type { Principles, Principle } from '@/lib/schemas/principles';

async function renderPrinciplesList(principles: Principle[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(PrinciplesList, {
    props: { principles },
  });
}

function buildOnePrinciple(): Principle {
  return {
    id: 'tests-document-intent',
    title: { es: 'Tests documentan intención', en: 'Tests document intent' },
    statement: {
      es: 'Un test sin asserts concretos no documenta nada.',
      en: 'A test without concrete asserts documents nothing.',
    },
  };
}

function buildPrinciples(count: number): Principle[] {
  const list: Principle[] = [];
  for (let index = 0; index < count; index += 1) {
    list.push({
      id: `principle-fixture-${String(index + 1)}`,
      title: {
        es: `Título ES número ${String(index + 1)}`,
        en: `Title EN number ${String(index + 1)}`,
      },
      statement: {
        es: `Statement ES número ${String(index + 1)}.`,
        en: `Statement EN number ${String(index + 1)}.`,
      },
    });
  }
  return list;
}

describe('PrinciplesList (render-test)', () => {
  it('renders a single entry when principles has length 1', async () => {
    const principles = [buildOnePrinciple()];
    const html = await renderPrinciplesList(principles);
    const entries = html.match(/<article[^>]*data-principle-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected principle entries to render');
    }
    expect(entries).toHaveLength(1);
  });

  it('renders five entries when principles has length 5 (typical set)', async () => {
    const principles: Principles['principles'] = buildPrinciples(5);
    const html = await renderPrinciplesList(principles);
    const entries = html.match(/<article[^>]*data-principle-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected principle entries to render');
    }
    expect(entries).toHaveLength(5);
  });

  it('renders ten entries when principles has length 10 (extended set)', async () => {
    const principles: Principles['principles'] = buildPrinciples(10);
    const html = await renderPrinciplesList(principles);
    const entries = html.match(/<article[^>]*data-principle-entry/g);
    expect(entries).not.toBeNull();
    if (entries === null) {
      throw new Error('expected principle entries to render');
    }
    expect(entries).toHaveLength(10);
  });

  it('projects principle.id to the DOM via id attribute on each entry heading', async () => {
    const principles = buildPrinciples(3);
    const html = await renderPrinciplesList(principles);
    for (const principle of principles) {
      expect(html).toMatch(new RegExp(`id="${principle.id}"`));
    }
  });

  it('uses an h3 heading for each principle title (under page h1 + block h2)', async () => {
    const principles = buildPrinciples(3);
    const html = await renderPrinciplesList(principles);
    const headings = html.match(/<h3[^>]*id="principle-fixture-\d+"/g);
    expect(headings).not.toBeNull();
    if (headings === null) {
      throw new Error('expected h3 headings for principles');
    }
    expect(headings).toHaveLength(3);
  });

  it('renders both Spanish and English title for each principle in <span lang>', async () => {
    const principles = buildPrinciples(2);
    const html = await renderPrinciplesList(principles);
    for (const principle of principles) {
      expect(html).toContain(principle.title.es);
      expect(html).toContain(principle.title.en);
    }
  });

  it('renders both Spanish and English statement for each principle', async () => {
    const principles = buildPrinciples(2);
    const html = await renderPrinciplesList(principles);
    for (const principle of principles) {
      expect(html).toContain(principle.statement.es);
      expect(html).toContain(principle.statement.en);
    }
  });

  it('renders the title text wrapped in explicit lang="es" and lang="en" spans', async () => {
    const principle = buildOnePrinciple();
    const html = await renderPrinciplesList([principle]);
    const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="es"[^>]*>${escapeRegExp(principle.title.es)}</span>`),
    );
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="en"[^>]*>${escapeRegExp(principle.title.en)}</span>`),
    );
  });

  it('renders the statement text wrapped in explicit lang="es" and lang="en" spans', async () => {
    const principle = buildOnePrinciple();
    const html = await renderPrinciplesList([principle]);
    const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="es"[^>]*>${escapeRegExp(principle.statement.es)}</span>`),
    );
    expect(html).toMatch(
      new RegExp(`<span[^>]*lang="en"[^>]*>${escapeRegExp(principle.statement.en)}</span>`),
    );
  });

  it('preserves the order of the principles array in the rendered output', async () => {
    const principles = buildPrinciples(4);
    const html = await renderPrinciplesList(principles);
    const indices = principles.map((principle) => html.indexOf(`id="${principle.id}"`));
    for (let position = 1; position < indices.length; position += 1) {
      const previous = indices[position - 1];
      const current = indices[position];
      if (previous === undefined || current === undefined) {
        throw new Error('expected all principle ids to appear in the rendered HTML');
      }
      expect(current).toBeGreaterThan(previous);
    }
  });
});
