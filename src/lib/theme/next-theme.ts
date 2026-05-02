export const THEME_NAMES = ['dark', 'light', 'paper'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = 'dark';

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light' || value === 'paper';
}

export function nextTheme(current: unknown): ThemeName {
  if (!isThemeName(current)) {
    return DEFAULT_THEME;
  }
  const currentIndex = THEME_NAMES.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEME_NAMES.length;
  const candidate = THEME_NAMES[nextIndex];
  return candidate ?? DEFAULT_THEME;
}
