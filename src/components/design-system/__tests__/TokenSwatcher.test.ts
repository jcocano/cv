import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import TokenSwatcher from '@/components/design-system/TokenSwatcher.astro';

async function renderTokenSwatcher(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TokenSwatcher);
}

describe('TokenSwatcher (render-test)', () => {
  it('renders a theme-block per theme (dark, light, paper) with data-theme-preview', async () => {
    const html = await renderTokenSwatcher();
    expect(html).toMatch(/data-theme-preview="dark"/);
    expect(html).toMatch(/data-theme-preview="light"/);
    expect(html).toMatch(/data-theme-preview="paper"/);
  });

  it('renders an h4 with id token-theme-<theme> for each of the three themes (theme headings live two levels below the foundations h2 wrapper + the tokens-by-theme h3 sub-block)', async () => {
    const html = await renderTokenSwatcher();
    expect(html).toMatch(/<h4[^>]*id="token-theme-dark"/);
    expect(html).toMatch(/<h4[^>]*id="token-theme-light"/);
    expect(html).toMatch(/<h4[^>]*id="token-theme-paper"/);
    // No leftover h2 with the same ids — strict hierarchy under foundations.
    expect(html).not.toMatch(/<h2[^>]*id="token-theme-/);
  });

  it('renders chips with data-theme attribute on the swatch group for live theme preview', async () => {
    const html = await renderTokenSwatcher();
    expect(html).toMatch(/data-theme="dark"/);
    expect(html).toMatch(/data-theme="light"/);
    expect(html).toMatch(/data-theme="paper"/);
  });

  it('renders all 11 token names in mono inside each theme-block (33 swatches total)', async () => {
    const html = await renderTokenSwatcher();
    const tokenNames = [
      'bg',
      'bg-elev',
      'bg-elev-2',
      'fg',
      'fg-dim',
      'fg-mute',
      'line',
      'line-soft',
      'accent',
      'accent-dim',
      'warn',
    ];
    for (const token of tokenNames) {
      const matches = html.match(new RegExp(`>${token}<`, 'g'));
      expect(matches).not.toBeNull();
      if (matches === null) {
        throw new Error(`expected token name "${token}" to appear once per theme`);
      }
      expect(matches.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses style="background: var(--<token>);" on every chip (CSS var consumption)', async () => {
    const html = await renderTokenSwatcher();
    expect(html).toMatch(/style="background: var\(--bg\);"/);
    expect(html).toMatch(/style="background: var\(--accent\);"/);
    expect(html).toMatch(/style="background: var\(--warn\);"/);
  });

  it('reuses data-toggle-theme-label so the existing nav toggle keeps showing the active theme', async () => {
    const html = await renderTokenSwatcher();
    expect(html).toMatch(/data-toggle-theme-label/);
  });
});
