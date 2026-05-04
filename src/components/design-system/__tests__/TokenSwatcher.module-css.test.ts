import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The CSS module of `TokenSwatcher` must override the 11 design tokens for
 * each of the three theme-blocks via a `[data-theme-preview="<theme>"]`
 * selector. Without this override, the chips inside each theme-block fall back
 * to the global `:root[data-theme=...]` cascade and end up showing the colors
 * of the active theme instead of the colors fixed for that block.
 *
 * The override must NOT be applied to `.themeBlock` itself — the block's own
 * background/border (`var(--bg-elev)` + `var(--line)`) must keep following the
 * global theme, so only the chips/name-text inside reflect the fixed theme.
 */

const TOKENS = [
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
] as const;

const THEMES = ['dark', 'light', 'paper'] as const;

const cssPath = fileURLToPath(new URL('../TokenSwatcher.module.css', import.meta.url));
const css = readFileSync(cssPath, 'utf8');

function blockFor(theme: string): string {
  // Pull the contiguous text from the selector up to the next closing brace.
  // Sufficient for our linear CSS module (no nested braces in the override block).
  // Accept both single and double quotes in the attribute selector.
  const re = new RegExp(`\\[data-theme-preview=['"]${theme}['"]\\][^{]*\\{([^}]*)\\}`);
  const match = css.match(re);
  return match?.[1] ?? '';
}

describe('TokenSwatcher.module.css — token overrides per theme-block', () => {
  it.each(THEMES)('declares an override block for [data-theme-preview="%s"]', (theme) => {
    const block = blockFor(theme);
    expect(block).not.toBe('');
  });

  it.each(THEMES)('declares all 11 design tokens inside [data-theme-preview="%s"]', (theme) => {
    const block = blockFor(theme);
    for (const token of TOKENS) {
      const re = new RegExp(`--${token}\\s*:`);
      expect(block).toMatch(re);
    }
  });

  it('does not scope the token overrides to the .themeBlock element itself', () => {
    // The .themeBlock keeps its background and border driven by the GLOBAL
    // theme (var(--bg-elev) / var(--line)). If the overrides were combined
    // with .themeBlock, the box would also become fixed — bug.
    // We assert by inspecting the override selectors: they must target a
    // child element (e.g. `.themeContent` / `.swatches`), not the block.
    const overrideSelectors = css.match(
      /\[data-theme-preview=['"](?:dark|light|paper)['"]\][^{]*\{/g,
    );
    expect(overrideSelectors).not.toBeNull();
    if (overrideSelectors === null) {
      throw new Error('expected the three override selectors to be present');
    }
    for (const selector of overrideSelectors) {
      // The selector must not END at the attribute (which would mean the
      // element with `data-theme-preview` itself receives the override).
      // It must chain a descendant — either a class (.something) or a
      // direct-child combinator (>).
      expect(selector).toMatch(
        /\[data-theme-preview=['"](?:dark|light|paper)['"]\]\s+\.[a-zA-Z][a-zA-Z0-9_-]*/,
      );
    }
  });

  it('uses the literal token values from src/styles/tokens.css for each theme', () => {
    // Spot-check 2 tokens per theme so the override values stay in sync
    // with the source of truth in `src/styles/tokens.css`.
    const dark = blockFor('dark');
    expect(dark).toMatch(/--bg\s*:\s*#0a0a0b/);
    expect(dark).toMatch(/--accent\s*:\s*oklch\(0\.82 0\.16 145\)/);

    const light = blockFor('light');
    expect(light).toMatch(/--bg\s*:\s*#fafaf8/);
    expect(light).toMatch(/--accent\s*:\s*oklch\(0\.48 0\.18 145\)/);

    const paper = blockFor('paper');
    expect(paper).toMatch(/--bg\s*:\s*#f5f1e8/);
    expect(paper).toMatch(/--accent\s*:\s*oklch\(0\.5 0\.2 50\)/);
  });
});
