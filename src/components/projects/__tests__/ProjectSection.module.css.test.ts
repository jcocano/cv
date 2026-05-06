import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('declares display: none on empty <p> children of .body (iter 7 defensive guard)', () => {
    const emptyPBody = extractRuleBody(readProjectSectionCss(), '.body :global(p:empty)');
    expect(emptyPBody).toMatch(/(^|\s|;)display\s*:\s*none\b/);
  });
});
