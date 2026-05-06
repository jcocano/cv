// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

type ThemeName = 'dark' | 'light' | 'paper';

interface IconWrapper {
  readonly theme: ThemeName;
  readonly element: HTMLSpanElement;
}

function mirrorSiteNavThemeIconRules(target: Document): void {
  const style = target.createElement('style');
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
  target.head.appendChild(style);
}

function setupDocument(htmlTheme: ThemeName): {
  readonly icons: ReadonlyArray<IconWrapper>;
} {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');

  mirrorSiteNavThemeIconRules(document);
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
