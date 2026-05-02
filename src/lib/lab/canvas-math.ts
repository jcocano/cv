export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
}

const NOISE_SPATIAL_FREQUENCY_X = 0.012;
const NOISE_SPATIAL_FREQUENCY_Y = 0.018;
const NOISE_TIME_FREQUENCY = 0.6;
const NOISE_ANGLE_SCALE = Math.PI;

export function noiseField(x: number, y: number, t: number): number {
  const spatial =
    Math.sin(x * NOISE_SPATIAL_FREQUENCY_X + t * NOISE_TIME_FREQUENCY) +
    Math.cos(y * NOISE_SPATIAL_FREQUENCY_Y - t * NOISE_TIME_FREQUENCY * 0.7);
  return spatial * NOISE_ANGLE_SCALE;
}

export function repulsion(particle: Particle, cursor: Vector2, radius: number): Vector2 {
  if (radius <= 0) {
    throw new Error('repulsion requires radius > 0');
  }
  const dx = particle.x - cursor.x;
  const dy = particle.y - cursor.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance >= radius || distance === 0) {
    return { x: 0, y: 0 };
  }
  const falloff = 1 - distance / radius;
  const inverseDistance = 1 / distance;
  return {
    x: dx * inverseDistance * falloff,
    y: dy * inverseDistance * falloff,
  };
}
