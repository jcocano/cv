import { describe, expect, it } from 'vitest';

import { nudgeOffset, proximityToWeight, shouldShiftColor } from '@/lib/lab/kinetic-math';

describe('proximityToWeight', () => {
  it('returns the maximum weight 800 when distance is exactly 0', () => {
    expect(proximityToWeight(0, 200)).toBe(800);
  });

  it('returns the base weight 300 when distance equals maxDistance', () => {
    expect(proximityToWeight(200, 200)).toBe(300);
  });

  it('linearly interpolates: distance 100 of 200 → 550', () => {
    expect(proximityToWeight(100, 200)).toBe(550);
  });

  it('clamps a negative distance to factor 1, returning the maximum weight 800', () => {
    expect(proximityToWeight(-10, 200)).toBe(800);
  });

  it('returns the base weight 300 when distance is past the maximum', () => {
    expect(proximityToWeight(300, 200)).toBe(300);
  });

  it('throws when maxDistance is 0 (would divide by zero)', () => {
    expect(() => proximityToWeight(50, 0)).toThrow(/maxDistance/);
  });

  it('throws when maxDistance is negative', () => {
    expect(() => proximityToWeight(50, -5)).toThrow(/maxDistance/);
  });
});

describe('nudgeOffset', () => {
  it('returns -dx * 0.04 at distance 0 (factor 1): dx=100 → -4', () => {
    expect(nudgeOffset(100, 0, 200)).toBe(-4);
  });

  it('returns 0 when distance equals maxDistance (factor 0)', () => {
    expect(nudgeOffset(0, 200, 200)).toBe(0);
  });

  it('combines dx and proximity factor: dx=-50, distance=100, max=200 → 1', () => {
    expect(nudgeOffset(-50, 100, 200)).toBe(1);
  });

  it('returns 0 when dx is 0 regardless of distance', () => {
    expect(nudgeOffset(0, 50, 200)).toBe(0);
  });

  it('clamps a negative distance to factor 1: dx=200, distance=-10 → -8', () => {
    expect(nudgeOffset(200, -10, 200)).toBe(-8);
  });

  it('returns 0 when distance is past the maximum', () => {
    expect(nudgeOffset(100, 300, 200)).toBe(0);
  });

  it('throws when maxDistance is 0', () => {
    expect(() => nudgeOffset(100, 50, 0)).toThrow(/maxDistance/);
  });
});

describe('shouldShiftColor', () => {
  it('returns true when the proximity factor is strictly greater than 0.5', () => {
    expect(shouldShiftColor(50, 200)).toBe(true);
  });

  it('returns false when the proximity factor equals exactly 0.5 (literal > not >=)', () => {
    expect(shouldShiftColor(100, 200)).toBe(false);
  });

  it('returns false when the proximity factor is just under 0.5', () => {
    expect(shouldShiftColor(101, 200)).toBe(false);
  });

  it('returns true when distance is 0 (factor 1)', () => {
    expect(shouldShiftColor(0, 200)).toBe(true);
  });

  it('returns false when distance is past the maximum', () => {
    expect(shouldShiftColor(300, 200)).toBe(false);
  });

  it('returns true when distance is negative (clamped to factor 1)', () => {
    expect(shouldShiftColor(-10, 200)).toBe(true);
  });

  it('throws when maxDistance is 0', () => {
    expect(() => shouldShiftColor(50, 0)).toThrow(/maxDistance/);
  });
});
