import { describe, expect, it } from 'vitest';

import {
  DESCRIPTION_SOFT_LIMIT_CHARS,
  TAGLINE_SOFT_LIMIT_CHARS,
  checkDescriptionSoftLimit,
  checkTaglineSoftLimit,
} from '@/lib/content/projects-assistant/soft-limits';

describe('soft-limits constants', () => {
  it('caps tagline at 80 characters', () => {
    expect(TAGLINE_SOFT_LIMIT_CHARS).toBe(80);
  });

  it('caps description at 280 characters', () => {
    expect(DESCRIPTION_SOFT_LIMIT_CHARS).toBe(280);
  });
});

describe('checkTaglineSoftLimit', () => {
  it('returns ok=true for a value well below the 80-char limit', () => {
    const result = checkTaglineSoftLimit('short tagline');
    expect(result).toEqual({ ok: true });
  });

  it('returns ok=true for a value exactly at the 80-char limit', () => {
    const exactlyEighty = 'a'.repeat(80);
    expect(exactlyEighty).toHaveLength(80);
    const result = checkTaglineSoftLimit(exactlyEighty);
    expect(result).toEqual({ ok: true });
  });

  it('returns ok=false with exceededBy and limit for a value above 80 chars', () => {
    const eightyOne = 'a'.repeat(81);
    const result = checkTaglineSoftLimit(eightyOne);
    expect(result).toEqual({ ok: false, exceededBy: 1, limit: 80 });
  });

  it('reports the exact char overage for a value far above the limit', () => {
    const oneHundred = 'a'.repeat(100);
    const result = checkTaglineSoftLimit(oneHundred);
    expect(result).toEqual({ ok: false, exceededBy: 20, limit: 80 });
  });
});

describe('checkDescriptionSoftLimit', () => {
  it('returns ok=true for a value well below the 280-char limit', () => {
    const result = checkDescriptionSoftLimit('a short description');
    expect(result).toEqual({ ok: true });
  });

  it('returns ok=true for a value exactly at the 280-char limit', () => {
    const exactlyLimit = 'a'.repeat(280);
    expect(exactlyLimit).toHaveLength(280);
    const result = checkDescriptionSoftLimit(exactlyLimit);
    expect(result).toEqual({ ok: true });
  });

  it('returns ok=false with exceededBy and limit for a value above 280 chars', () => {
    const twoEightyOne = 'a'.repeat(281);
    const result = checkDescriptionSoftLimit(twoEightyOne);
    expect(result).toEqual({ ok: false, exceededBy: 1, limit: 280 });
  });

  it('reports the exact char overage for a value far above the limit', () => {
    const threeHundred = 'a'.repeat(300);
    const result = checkDescriptionSoftLimit(threeHundred);
    expect(result).toEqual({ ok: false, exceededBy: 20, limit: 280 });
  });
});
