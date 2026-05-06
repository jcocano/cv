import { describe, expect, it } from 'vitest';

import { computeCardEyebrow } from './card-eyebrow';

describe('computeCardEyebrow', () => {
  it('formats index 0 as "<prefix>.01"', () => {
    expect(computeCardEyebrow('P', 0)).toBe('P.01');
    expect(computeCardEyebrow('D', 0)).toBe('D.01');
    expect(computeCardEyebrow('T', 0)).toBe('T.01');
  });

  it('formats index 1 as "<prefix>.02" (one-based, two-digit padding)', () => {
    expect(computeCardEyebrow('P', 1)).toBe('P.02');
  });

  it('formats index 9 as "<prefix>.10" (no padding required for two digits)', () => {
    expect(computeCardEyebrow('P', 9)).toBe('P.10');
  });

  it('formats index 99 as "<prefix>.100" (third digit appended naturally)', () => {
    expect(computeCardEyebrow('P', 99)).toBe('P.100');
  });

  it('throws on a negative index (only non-negative orders are meaningful)', () => {
    expect(() => computeCardEyebrow('P', -1)).toThrow(/non-negative/);
  });

  it('throws on a non-integer index', () => {
    expect(() => computeCardEyebrow('P', 1.5)).toThrow(/integer/);
  });

  it('throws on an empty prefix string', () => {
    expect(() => computeCardEyebrow('', 0)).toThrow(/prefix/);
  });

  it('preserves the exact prefix passed in (no upper/lower-casing inside the helper)', () => {
    expect(computeCardEyebrow('p', 0)).toBe('p.01');
    expect(computeCardEyebrow('Pillar', 0)).toBe('Pillar.01');
  });
});
