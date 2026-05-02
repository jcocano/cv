const BASE_WEIGHT = 300;
const WEIGHT_RANGE = 500;
const NUDGE_FACTOR = 0.04;
const COLOR_SHIFT_THRESHOLD = 0.5;

function proximityFactor(distance: number, maxDistance: number): number {
  if (maxDistance <= 0) {
    throw new Error('proximityFactor requires maxDistance > 0');
  }
  if (distance <= 0) {
    return 1;
  }
  if (distance >= maxDistance) {
    return 0;
  }
  return 1 - distance / maxDistance;
}

export function proximityToWeight(distance: number, maxDistance: number): number {
  return BASE_WEIGHT + proximityFactor(distance, maxDistance) * WEIGHT_RANGE;
}

export function nudgeOffset(dx: number, distance: number, maxDistance: number): number {
  const factor = proximityFactor(distance, maxDistance);
  if (factor === 0 || dx === 0) {
    return 0;
  }
  return -dx * NUDGE_FACTOR * factor;
}

export function shouldShiftColor(distance: number, maxDistance: number): boolean {
  return proximityFactor(distance, maxDistance) > COLOR_SHIFT_THRESHOLD;
}
