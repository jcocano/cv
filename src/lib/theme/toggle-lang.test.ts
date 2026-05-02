import { describe, expect, it } from 'vitest';

import { toggleLang } from '@/lib/theme/toggle-lang';

describe('toggleLang', () => {
  it('returns en when current is es', () => {
    expect(toggleLang('es')).toBe('en');
  });

  it('returns es when current is en', () => {
    expect(toggleLang('en')).toBe('es');
  });

  it('returns es as fallback when current is an unknown string', () => {
    expect(toggleLang('fr')).toBe('es');
  });

  it('returns es as fallback when current is null', () => {
    expect(toggleLang(null)).toBe('es');
  });

  it('returns es as fallback when current is undefined', () => {
    expect(toggleLang(undefined)).toBe('es');
  });

  it('is involutive: toggling twice returns the original valid lang', () => {
    expect(toggleLang(toggleLang('es'))).toBe('es');
    expect(toggleLang(toggleLang('en'))).toBe('en');
  });
});
