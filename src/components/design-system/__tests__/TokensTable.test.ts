import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TokensTable from '@/components/design-system/TokensTable.astro';
import { CANONICAL_TOKEN_NAMES, TOKEN_VALUES_BY_THEME } from '@/lib/theme/token-values';

async function renderTokensTable(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TokensTable);
}

describe('TokensTable (render-test)', () => {
  it('renders a <table> with class hooks for the tokens table layout', async () => {
    const html = await renderTokensTable();
    expect(html).toMatch(/<table[^>]*data-component="tokens-table"/);
  });

  it('renders a <thead> with one <th> per column: Token, dark, light, paper', async () => {
    const html = await renderTokensTable();
    expect(html).toMatch(/<thead[\s\S]*?<th[^>]*>\s*Token\s*<\/th>/);
    expect(html).toMatch(/<thead[\s\S]*?<th[^>]*>\s*dark\s*<\/th>/);
    expect(html).toMatch(/<thead[\s\S]*?<th[^>]*>\s*light\s*<\/th>/);
    expect(html).toMatch(/<thead[\s\S]*?<th[^>]*>\s*paper\s*<\/th>/);
  });

  it('renders one <tr> per canonical token (11 rows in tbody)', async () => {
    const html = await renderTokensTable();
    const tbodyMatch = html.match(/<tbody[\s\S]*?<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    if (tbodyMatch === null) {
      throw new Error('expected a <tbody> in the rendered HTML');
    }
    const rows = tbodyMatch[0].match(/<tr[\s>]/g);
    expect(rows).not.toBeNull();
    if (rows === null) {
      throw new Error('expected at least one <tr> in <tbody>');
    }
    expect(rows).toHaveLength(CANONICAL_TOKEN_NAMES.length);
  });

  it('renders the token name `--<name>` in the first cell of every row', async () => {
    const html = await renderTokensTable();
    for (const token of CANONICAL_TOKEN_NAMES) {
      expect(html).toMatch(
        new RegExp(`<td[^>]*data-token-name="${token}"[^>]*>[\\s\\S]*?--${token}[\\s\\S]*?</td>`),
      );
    }
  });

  it('renders one swatch + hex value per theme cell using inline background style', async () => {
    const html = await renderTokensTable();
    // Spot-check one token across the three themes.
    const darkBg = TOKEN_VALUES_BY_THEME.dark.bg;
    const lightBg = TOKEN_VALUES_BY_THEME.light.bg;
    const paperBg = TOKEN_VALUES_BY_THEME.paper.bg;
    expect(html).toContain(`background:${darkBg}`);
    expect(html).toContain(`background:${lightBg}`);
    expect(html).toContain(`background:${paperBg}`);
    // The textual hex value also appears in the cell, in mono.
    expect(html).toContain(darkBg);
    expect(html).toContain(lightBg);
    expect(html).toContain(paperBg);
  });

  it('renders all 11 × 3 = 33 swatch cells (one per token × theme)', async () => {
    const html = await renderTokensTable();
    const swatches = html.match(/data-token-swatch=/g);
    expect(swatches).not.toBeNull();
    if (swatches === null) {
      throw new Error('expected at least one swatch cell');
    }
    expect(swatches).toHaveLength(CANONICAL_TOKEN_NAMES.length * 3);
  });

  it('preserves the bilingual "Active theme" legend (feature #32 contract)', async () => {
    const html = await renderTokensTable();
    expect(html).toMatch(/Active theme:/);
    expect(html).toMatch(/data-toggle-theme-label/);
  });
});
