import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regression test for the "labels descolocados verticalmente" bug
 * (feature #17 reapertura, iter 2 — paridad visual con handoff).
 *
 * The label rail of <ProjectSection> previously used `position: sticky;
 * top: 90px;`. Because each <ProjectSection> is its own grid container, the
 * sticky rule made each label re-anchor inside its own section instead of
 * tracking the global scroll, leaving labels visually misaligned.
 *
 * Fix: drop `position: sticky` and `top: …` from the .label rule. Keep
 * `align-self: start` so the label still hugs the top of its row.
 *
 * If a future change reintroduces sticky on this rule, this test fails
 * loudly with the exact reason. The test is intentionally narrow: it only
 * inspects the .label rule body, so unrelated CSS changes won't trigger it.
 */
function readProjectSectionCss(): string {
  return readFileSync(resolve(__dirname, '../ProjectSection.module.css'), 'utf8');
}

function extractRuleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  const body = match?.[1];
  if (body === undefined) {
    throw new Error(`Selector ${selector} not found in CSS`);
  }
  return body;
}

describe('ProjectSection.module.css (regression)', () => {
  it('does not declare position: sticky on the .label rule', () => {
    const labelBody = extractRuleBody(readProjectSectionCss(), '.label');
    expect(labelBody).not.toMatch(/position\s*:\s*sticky/);
  });

  it('does not declare a top offset on the .label rule', () => {
    const labelBody = extractRuleBody(readProjectSectionCss(), '.label');
    expect(labelBody).not.toMatch(/(^|\s|;)top\s*:/);
  });

  it('still keeps align-self: start on the .label rule', () => {
    const labelBody = extractRuleBody(readProjectSectionCss(), '.label');
    expect(labelBody).toMatch(/align-self\s*:\s*start/);
  });

  /**
   * Regression for feature #17 iter 4 (cleanup estructural del body):
   *
   * The previous iter 3 fixes (`.body > :first-child { margin-top: 0 }`,
   * `line-height: 1.7` and `padding-top: 7px` on `.label`) were dropped in
   * favour of a structural cleanup decided with the user:
   *
   *   - `MetricGrid` and `ArchDiagram` no longer carry vertical margins
   *     (paso 5 of iter 4), so `.body > :first-child` becomes redundant.
   *   - The label inherits its natural baseline (no `line-height` / no
   *     `padding-top` calculations) — alignment is handled by the grid,
   *     not by per-rule arithmetic.
   *   - `.body` becomes a vertical flex container with a `gap: 28px` so
   *     spacing between body children is uniform without hand-tuning per
   *     element.
   *
   * The asserts below pin that cleanup. If a future change reintroduces
   * the calculated paddings or the obsolete `:first-child` rule, this
   * test fails loudly with the exact reason.
   */
  it('does not declare padding-top on the .label rule (cleanup iter 4)', () => {
    const labelBody = extractRuleBody(readProjectSectionCss(), '.label');
    expect(labelBody).not.toMatch(/(^|\s|;)padding-top\s*:/);
  });

  it('does not declare a .body > :first-child reset rule (cleanup iter 4)', () => {
    const css = readProjectSectionCss();
    expect(css).not.toMatch(/\.body\s*>\s*:first-child\s*\{/);
  });

  it('declares display: flex on the .body rule for vertical stacking', () => {
    const bodyBody = extractRuleBody(readProjectSectionCss(), '.body');
    expect(bodyBody).toMatch(/display\s*:\s*flex/);
  });

  it('declares flex-direction: column on the .body rule', () => {
    const bodyBody = extractRuleBody(readProjectSectionCss(), '.body');
    expect(bodyBody).toMatch(/flex-direction\s*:\s*column/);
  });

  it('declares gap: 28px on the .body rule for uniform inter-child spacing', () => {
    const bodyBody = extractRuleBody(readProjectSectionCss(), '.body');
    expect(bodyBody).toMatch(/(^|\s|;)gap\s*:\s*28px/);
  });

  /**
   * Regression for feature #17 iter 5 (padding uniforme + baseline label).
   *
   * Iter 4 left two padding variants on `.section`:
   *   - `.section { padding: 0 0 80px }` (zero top — non-first sections
   *     ended up glued to the bottom border of the previous section).
   *   - `.section.first { padding: 80px 0 }` (special-case for the first
   *     section, applied via a `first` prop on `<ProjectSection>`).
   *
   * The user reported (after iter 4 visual review) that "context" had
   * plenty of breathing room while "impact" looked glued to the line above
   * because of the padding-top:0 on non-first sections.
   *
   * Iter 5 collapses this to a single uniform rule `.section { padding:
   * 80px 0 }` and removes the `.section.first` variant entirely.
   *
   * The `.label` baseline mismatch with the body `<p>` (label has default
   * `line-height: 1`, body p has `line-height: 1.7`) is fixed by adding
   * `line-height: 1.7` to the `.label` so both share the same line-box.
   * The remaining ~1.8px residual is within visual tolerance (decided by
   * the leader, recorded in the iter 5 plan).
   */
  it('declares uniform padding: 80px 0 on the .section rule (iter 5)', () => {
    const sectionBody = extractRuleBody(readProjectSectionCss(), '.section');
    expect(sectionBody).toMatch(/(^|\s|;)padding\s*:\s*80px\s+0\b/);
  });

  it('does NOT declare a .section.first variant (iter 5: padding is uniform)', () => {
    const css = readProjectSectionCss();
    expect(css).not.toMatch(/\.section\.first\s*\{/);
  });

  it('declares line-height: 1.7 on the .label rule to match the body p baseline (iter 5)', () => {
    const labelBody = extractRuleBody(readProjectSectionCss(), '.label');
    expect(labelBody).toMatch(/(^|\s|;)line-height\s*:\s*1\.7\b/);
  });

  /**
   * Regression for feature #17 iter 6 (eliminar margin del <p> y manejar
   * spacing con flex gap).
   *
   * Iter 5 left `.body :global(p) { margin: 0 0 20px }`. With `.body` being a
   * flex column with `gap: 28px`, the bottom margin of the last <p> inside a
   * <Lang> wrapper added 20px to the height of the <Lang> div, which then
   * combined with the 28px gap of `.body` to yield 48px between the <Lang>
   * block and the next body child (e.g. <MetricGrid>). The user reported the
   * uneven spacing and identified the cause directly: the spurious bottom
   * margin on the <p>.
   *
   * Iter 6 fix:
   *   - `.body :global(p)` declares `margin: 0` (no bottom margin).
   *   - A new rule `.body :global([lang]) { display: flex; flex-direction:
   *     column; gap: 20px }` keeps the visual separation between consecutive
   *     <p> children inside the same <Lang> wrapper. The selector is local
   *     to `.body` (not global) so it only affects <Lang> wrappers that live
   *     inside a ProjectSection — other usages of <Lang> across the site
   *     remain untouched.
   *
   * The asserts below pin both halves of the contract: the <p> rule has no
   * bottom margin, and the [lang] container stacks its children with a
   * 20px flex gap.
   */
  it('declares margin: 0 on the .body p rule (iter 6: no spurious bottom margin)', () => {
    const pBody = extractRuleBody(readProjectSectionCss(), '.body :global(p)');
    expect(pBody).toMatch(/(^|\s|;)margin\s*:\s*0\s*(;|$)/);
    expect(pBody).not.toMatch(/margin\s*:\s*0\s+0\s+20px/);
    expect(pBody).not.toMatch(/margin-bottom\s*:/);
  });

  it('stacks [lang] children in .body with display: flex, column direction, gap 20px (iter 6)', () => {
    const langBody = extractRuleBody(readProjectSectionCss(), '.body :global([lang])');
    expect(langBody).toMatch(/(^|\s|;)display\s*:\s*flex\b/);
    expect(langBody).toMatch(/(^|\s|;)flex-direction\s*:\s*column\b/);
    expect(langBody).toMatch(/(^|\s|;)gap\s*:\s*20px\b/);
  });

  /**
   * Regression for feature #17 iter 7 (defensive cleanup of empty <p>).
   *
   * Even after rewriting the .mdx files to use markdown prose inside <Lang>
   * instead of literal <p> tags, MDX edge cases or future content additions
   * could reintroduce a spurious empty <p>. The flex column gap on the
   * `<Lang>` wrapper would then leave a visible band between the empty <p>
   * and the next sibling.
   *
   * Defensive guard: `.body :global(p:empty) { display: none }` hides any
   * empty <p> that may slip through. Items with `display: none` are excluded
   * from the flex layout, so they don't contribute to the gap.
   */
  it('declares display: none on empty <p> children of .body (iter 7 defensive guard)', () => {
    const emptyPBody = extractRuleBody(readProjectSectionCss(), '.body :global(p:empty)');
    expect(emptyPBody).toMatch(/(^|\s|;)display\s*:\s*none\b/);
  });
});
