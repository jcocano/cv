import { describe, expect, it } from 'vitest';

import { noiseField, repulsion } from '@/lib/lab/canvas-math';
import type { Particle, Vector2 } from '@/lib/lab/canvas-math';

describe('noiseField', () => {
  it('returns the same value for the same (x, y, t) inputs (deterministic)', () => {
    const first = noiseField(120, 80, 0.5);
    const second = noiseField(120, 80, 0.5);
    expect(second).toBe(first);
  });

  it('returns a finite number for a typical input', () => {
    const angle = noiseField(50, 50, 0);
    expect(Number.isFinite(angle)).toBe(true);
  });

  it('returns different values when t advances (the field evolves over time)', () => {
    const before = noiseField(120, 80, 0);
    const after = noiseField(120, 80, 1.7);
    expect(before).not.toBe(after);
  });

  it('returns different values for different (x, y) at the same t (spatial variation)', () => {
    const here = noiseField(0, 0, 0.25);
    const there = noiseField(400, 400, 0.25);
    expect(here).not.toBe(there);
  });
});

describe('Particle shape', () => {
  it('exposes x, y and previous-position fields px, py for line-trail rendering', () => {
    const particle: Particle = { x: 10, y: 20, px: 5, py: 15 };
    expect(particle.x).toBe(10);
    expect(particle.y).toBe(20);
    expect(particle.px).toBe(5);
    expect(particle.py).toBe(15);
  });
});

describe('repulsion', () => {
  const particleAtOrigin: Particle = { x: 0, y: 0, px: 0, py: 0 };

  it('returns the zero vector when distance is strictly greater than radius', () => {
    const cursor: Vector2 = { x: 200, y: 0 };
    const result = repulsion(particleAtOrigin, cursor, 80);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('returns the zero vector when distance is exactly equal to radius (boundary excluded)', () => {
    const cursor: Vector2 = { x: 80, y: 0 };
    const result = repulsion(particleAtOrigin, cursor, 80);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('returns a vector along +x when the cursor is to the left of the particle', () => {
    const particle: Particle = { x: 100, y: 0, px: 100, py: 0 };
    const cursor: Vector2 = { x: 50, y: 0 };
    const result = repulsion(particle, cursor, 80);
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBe(0);
  });

  it('returns a vector along -x when the cursor is to the right of the particle', () => {
    const particle: Particle = { x: 50, y: 0, px: 50, py: 0 };
    const cursor: Vector2 = { x: 100, y: 0 };
    const result = repulsion(particle, cursor, 80);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBe(0);
  });

  it('returns a vector along +y when the cursor is above the particle on the canvas', () => {
    const particle: Particle = { x: 0, y: 100, px: 0, py: 100 };
    const cursor: Vector2 = { x: 0, y: 60 };
    const result = repulsion(particle, cursor, 80);
    expect(result.x).toBe(0);
    expect(result.y).toBeGreaterThan(0);
  });

  it('produces a stronger push when the particle is closer to the cursor than when far', () => {
    const close: Particle = { x: 10, y: 0, px: 10, py: 0 };
    const far: Particle = { x: 70, y: 0, px: 70, py: 0 };
    const cursor: Vector2 = { x: 0, y: 0 };
    const closeResult = repulsion(close, cursor, 80);
    const farResult = repulsion(far, cursor, 80);
    expect(Math.abs(closeResult.x)).toBeGreaterThan(Math.abs(farResult.x));
  });

  it('throws when radius is 0 (would divide by zero)', () => {
    const cursor: Vector2 = { x: 10, y: 10 };
    expect(() => repulsion(particleAtOrigin, cursor, 0)).toThrow(/radius/);
  });

  it('throws when radius is negative', () => {
    const cursor: Vector2 = { x: 10, y: 10 };
    expect(() => repulsion(particleAtOrigin, cursor, -5)).toThrow(/radius/);
  });
});
