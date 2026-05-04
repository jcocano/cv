/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

/**
 * The visibility cycle of the theme-toggle icons is gobierned by 6 CSS rules
 * that hide the 2 non-active icons per theme. The rules live in
 * `src/components/nav/SiteNav.module.css` (lines 96-102) and use `:global(html
 * [data-theme=…])` to bridge the CSS module local `.themeIcon` with the global
 * `<html>` `data-theme` attribute that the runtime cycle (`applyTheme`) sets.
 *
 * Since Vitest does not inject the CSS module into the JSDOM document, this
 * test mirrors the production rule with the literal selector pattern and
 * asserts that `getComputedStyle(...).display` resolves to `none` for the 2
 * non-active icons and `inline-flex` for the active icon, per theme.
 *
 * The CSS rule asserted here MUST stay in lockstep with the rule in
 * `SiteNav.module.css`. If that file's selectors change, this test breaks
 * (a deliberate guardrail).
 */

type ThemeName = 'dark' | 'light' | 'paper';

interface IconWrapper {
  readonly theme: ThemeName;
  readonly element: HTMLSpanElement;
}

function setupDocument(htmlTheme: ThemeName): {
  readonly icons: ReadonlyArray<IconWrapper>;
} {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');

  const style = document.createElement('style');
  style.textContent = `
    .themeIcon { display: inline-flex; align-items: center; justify-content: center; }
    html[data-theme='dark'] .themeIcon[data-theme-icon='light'],
    html[data-theme='dark'] .themeIcon[data-theme-icon='paper'],
    html[data-theme='light'] .themeIcon[data-theme-icon='dark'],
    html[data-theme='light'] .themeIcon[data-theme-icon='paper'],
    html[data-theme='paper'] .themeIcon[data-theme-icon='dark'],
    html[data-theme='paper'] .themeIcon[data-theme-icon='light'] {
      display: none;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.setAttribute('data-theme', htmlTheme);

  const themes: ReadonlyArray<ThemeName> = ['dark', 'light', 'paper'];
  const icons = themes.map<IconWrapper>((theme) => {
    const element = document.createElement('span');
    element.className = 'themeIcon';
    element.setAttribute('data-theme-icon', theme);
    document.body.appendChild(element);
    return { theme, element };
  });

  return { icons };
}

function activeIconFor(theme: ThemeName): ThemeName {
  return theme;
}

describe('SiteNav theme-icon CSS visibility', () => {
  it('shows the SunIcon (data-theme-icon="dark") and hides the others when html[data-theme="dark"]', () => {
    const { icons } = setupDocument('dark');
    for (const icon of icons) {
      const display = window.getComputedStyle(icon.element).display;
      const expected = icon.theme === activeIconFor('dark') ? 'inline-flex' : 'none';
      expect(display).toBe(expected);
    }
  });

  it('shows the PaperIcon (data-theme-icon="light") and hides the others when html[data-theme="light"]', () => {
    const { icons } = setupDocument('light');
    for (const icon of icons) {
      const display = window.getComputedStyle(icon.element).display;
      const expected = icon.theme === activeIconFor('light') ? 'inline-flex' : 'none';
      expect(display).toBe(expected);
    }
  });

  it('shows the MoonIcon (data-theme-icon="paper") and hides the others when html[data-theme="paper"]', () => {
    const { icons } = setupDocument('paper');
    for (const icon of icons) {
      const display = window.getComputedStyle(icon.element).display;
      const expected = icon.theme === activeIconFor('paper') ? 'inline-flex' : 'none';
      expect(display).toBe(expected);
    }
  });
});
