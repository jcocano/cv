export const CANONICAL_TOKEN_NAMES = [
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

export type ColorTokenName = (typeof CANONICAL_TOKEN_NAMES)[number];

export const THEME_NAMES = ['dark', 'light', 'paper'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export type TokenValuesByTheme = Readonly<
  Record<ThemeName, Readonly<Record<ColorTokenName, string>>>
>;

export const TOKEN_VALUES_BY_THEME: TokenValuesByTheme = {
  dark: {
    bg: '#0a0a0b',
    'bg-elev': '#111113',
    'bg-elev-2': '#18181b',
    fg: '#fafafa',
    'fg-dim': '#a1a1aa',
    'fg-mute': '#7d7d86',
    line: '#27272a',
    'line-soft': '#1c1c1f',
    accent: 'oklch(0.82 0.16 145)',
    'accent-dim': 'oklch(0.82 0.16 145 / 0.12)',
    warn: 'oklch(0.78 0.15 60)',
  },
  light: {
    bg: '#fafaf8',
    'bg-elev': '#f3f3f0',
    'bg-elev-2': '#ebebe7',
    fg: '#0a0a0b',
    'fg-dim': '#52525b',
    'fg-mute': '#6e6e76',
    line: '#d4d4d4',
    'line-soft': '#e7e7e4',
    accent: 'oklch(0.48 0.18 145)',
    'accent-dim': 'oklch(0.48 0.18 145 / 0.1)',
    warn: 'oklch(0.78 0.15 60)',
  },
  paper: {
    bg: '#f5f1e8',
    'bg-elev': '#ede7d6',
    'bg-elev-2': '#e3dcc6',
    fg: '#1a1612',
    'fg-dim': '#5c5447',
    'fg-mute': '#6f6757',
    line: '#c8bfa5',
    'line-soft': '#d8d0b8',
    accent: 'oklch(0.5 0.2 50)',
    'accent-dim': 'oklch(0.5 0.2 50 / 0.12)',
    warn: 'oklch(0.78 0.15 60)',
  },
};
