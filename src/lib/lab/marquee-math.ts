export type MarqueeDirection = -1 | 1;

export interface MarqueeScrubState {
  readonly speed: number;
  readonly dir: MarqueeDirection;
}

const SLOWEST_SPEED_SECONDS = 60;
const FASTEST_SPEED_SECONDS = 6;
const SPEED_RANGE_SECONDS = SLOWEST_SPEED_SECONDS - FASTEST_SPEED_SECONDS;

function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

export function cursorXToSpeed(x: number, stageWidth: number): MarqueeScrubState {
  if (stageWidth <= 0) {
    throw new Error('cursorXToSpeed requires stageWidth > 0');
  }
  const ratio = x / stageWidth;
  const intensity = clamp01(Math.abs(ratio - 0.5) * 2);
  const speed = SLOWEST_SPEED_SECONDS - intensity * SPEED_RANGE_SECONDS;
  const dir: MarqueeDirection = ratio < 0.5 ? -1 : 1;
  return { speed, dir };
}
