import { describe, expect, it } from 'vitest';

import { cursorXToSpeed } from '@/lib/lab/marquee-math';

describe('cursorXToSpeed: speed mapping', () => {
  it('returns the maximum (slowest) speed of 60 when the cursor is at the exact center', () => {
    const result = cursorXToSpeed(100, 200);
    expect(result.speed).toBe(60);
  });

  it('returns the minimum (fastest) speed of 6 at the left edge x=0', () => {
    const result = cursorXToSpeed(0, 200);
    expect(result.speed).toBe(6);
  });

  it('returns the minimum (fastest) speed of 6 at the right edge x=stageWidth', () => {
    const result = cursorXToSpeed(200, 200);
    expect(result.speed).toBe(6);
  });

  it('clamps to the minimum speed of 6 when x is past the right edge', () => {
    const result = cursorXToSpeed(500, 200);
    expect(result.speed).toBe(6);
  });

  it('clamps to the minimum speed of 6 when x is negative (past the left edge)', () => {
    const result = cursorXToSpeed(-50, 200);
    expect(result.speed).toBe(6);
  });

  it('interpolates linearly between center (60) and edge (6): x=50 of width=200 → 33', () => {
    const result = cursorXToSpeed(50, 200);
    expect(result.speed).toBe(33);
  });

  it('interpolates symmetrically: x=150 of width=200 yields the same speed as x=50', () => {
    const left = cursorXToSpeed(50, 200);
    const right = cursorXToSpeed(150, 200);
    expect(right.speed).toBe(left.speed);
  });
});

describe('cursorXToSpeed: direction mapping', () => {
  it('returns dir -1 when the cursor is on the left half', () => {
    const result = cursorXToSpeed(50, 200);
    expect(result.dir).toBe(-1);
  });

  it('returns dir 1 when the cursor is on the right half', () => {
    const result = cursorXToSpeed(150, 200);
    expect(result.dir).toBe(1);
  });

  it('returns dir 1 at the exact center (boundary belongs to the right half)', () => {
    const result = cursorXToSpeed(100, 200);
    expect(result.dir).toBe(1);
  });

  it('returns dir 1 when x is past the right edge (clamped)', () => {
    const result = cursorXToSpeed(500, 200);
    expect(result.dir).toBe(1);
  });

  it('returns dir -1 when x is negative (clamped)', () => {
    const result = cursorXToSpeed(-50, 200);
    expect(result.dir).toBe(-1);
  });
});

describe('cursorXToSpeed: stageWidth validation', () => {
  it('throws when stageWidth is 0 (degenerate)', () => {
    expect(() => cursorXToSpeed(10, 0)).toThrow(/stageWidth/);
  });

  it('throws when stageWidth is negative', () => {
    expect(() => cursorXToSpeed(10, -200)).toThrow(/stageWidth/);
  });
});
