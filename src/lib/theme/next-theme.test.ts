import { describe, expect, it } from 'vitest';

import { nextTheme } from '@/lib/theme/next-theme';

describe('nextTheme', () => {
  it('returns light when current is dark', () => {
    expect(nextTheme('dark')).toBe('light');
  });

  it('returns paper when current is light', () => {
    expect(nextTheme('light')).toBe('paper');
  });

  it('returns dark when current is paper (closes the cycle)', () => {
    expect(nextTheme('paper')).toBe('dark');
  });

  it('returns dark as fallback when current is an unknown string', () => {
    expect(nextTheme('sepia')).toBe('dark');
  });

  it('returns dark as fallback when current is null', () => {
    expect(nextTheme(null)).toBe('dark');
  });

  it('returns dark as fallback when current is undefined', () => {
    expect(nextTheme(undefined)).toBe('dark');
  });

  it('completes a full cycle dark -> light -> paper -> dark when chained', () => {
    expect(nextTheme(nextTheme(nextTheme('dark')))).toBe('dark');
  });
});
