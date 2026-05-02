import { describe, expect, it } from 'vitest';

import { padNum } from '@/lib/content/pad-num';

describe('padNum', () => {
  it('pads single-digit numbers to width 2 with a leading zero', () => {
    expect(padNum(5)).toBe('05');
  });

  it('returns 0 as "00" (zero is the lower edge)', () => {
    expect(padNum(0)).toBe('00');
  });

  it('returns 1 as "01" (smallest positive single-digit)', () => {
    expect(padNum(1)).toBe('01');
  });

  it('returns 9 as "09" (largest single-digit)', () => {
    expect(padNum(9)).toBe('09');
  });

  it('returns 10 as "10" (boundary: no padding when width is already 2)', () => {
    expect(padNum(10)).toBe('10');
  });

  it('returns 12 as "12" (two-digit input passes through)', () => {
    expect(padNum(12)).toBe('12');
  });

  it('returns 100 as "100" (three-digit input passes through, no truncation)', () => {
    expect(padNum(100)).toBe('100');
  });
});
