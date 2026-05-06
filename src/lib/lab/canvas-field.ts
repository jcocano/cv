import { noiseField, repulsion, type Particle, type Vector2 } from '@/lib/lab/canvas-math';
import type { ThemeColors } from '@/lib/theme/theme-store';

export const FRAME_DURATION_MS = 1000 / 60;

const PARTICLE_SPEED = 0.9;
const REPULSION_STRENGTH = 1.5;
const TRAIL_FADE_ALPHA = 0.08;
const FIELD_TIME_STEP = 0.005;
const STROKE_LINE_WIDTH = 0.6;
const SNAPSHOT_TRAIL_LENGTH = 6;

export interface CanvasFieldRenderingContext {
  fillRect: (x: number, y: number, width: number, height: number) => void;
  clearRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  globalAlpha: number;
}

export interface FakeCanvas {
  width: number;
  height: number;
  getContext: (kind: '2d') => CanvasFieldRenderingContext | null;
}

export interface PointerTargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FakePointerTarget {
  addEventListener: (type: 'pointermove' | 'pointerleave', handler: PointerHandler) => void;
  removeEventListener: (type: 'pointermove' | 'pointerleave', handler: PointerHandler) => void;
  getBoundingClientRect: () => PointerTargetRect;
}

export type PointerHandler = ((event: PointerEvent) => void) | (() => void);

export interface FakeIntersectionTarget {
  readonly tag: string;
}

export interface FakeIntersectionEntry {
  readonly isIntersecting: boolean;
}

export type FakeIntersectionCallback = (
  entries: ReadonlyArray<FakeIntersectionEntry>,
  observer: FakeIntersectionObserver,
) => void;

export interface FakeIntersectionObserver {
  observe: (target: FakeIntersectionTarget) => void;
  disconnect: () => void;
}

export interface CanvasFieldDeps {
  canvas: FakeCanvas;
  pointerTarget: FakePointerTarget;
  intersectionTarget: FakeIntersectionTarget;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  now: () => number;
  createIntersectionObserver: (callback: FakeIntersectionCallback) => FakeIntersectionObserver;
  prefersReducedMotion: boolean;
  initialIsIntersecting: boolean;
  particleCount: number;
  repulsionRadius: number;
  random: () => number;
  getColors: () => ThemeColors;
  subscribeToColors: (callback: (colors: ThemeColors) => void) => () => void;
}

export interface CanvasFieldHandle {
  unmount: () => void;
}

interface InternalPointerHandlers {
  move: (event: PointerEvent) => void;
  leave: () => void;
}

function createInitialParticles(
  width: number,
  height: number,
  count: number,
  random: () => number,
): Particle[] {
  const particles: Particle[] = [];
  for (let index = 0; index < count; index += 1) {
    const x = random() * width;
    const y = random() * height;
    particles.push({ x, y, px: x, py: y });
  }
  return particles;
}

function stepParticle(
  particle: Particle,
  width: number,
  height: number,
  fieldTime: number,
  cursor: Vector2 | null,
  repulsionRadius: number,
  random: () => number,
): void {
  const angle = noiseField(particle.x, particle.y, fieldTime);
  let vx = Math.cos(angle) * PARTICLE_SPEED;
  let vy = Math.sin(angle) * PARTICLE_SPEED;

  if (cursor !== null) {
    const push = repulsion(particle, cursor, repulsionRadius);
    vx += push.x * REPULSION_STRENGTH;
    vy += push.y * REPULSION_STRENGTH;
  }

  particle.px = particle.x;
  particle.py = particle.y;
  particle.x += vx;
  particle.y += vy;

  if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height) {
    particle.x = random() * width;
    particle.y = random() * height;
    particle.px = particle.x;
    particle.py = particle.y;
  }
}

function paintTrailFade(
  context: CanvasFieldRenderingContext,
  width: number,
  height: number,
  bgColor: string,
): void {
  context.fillStyle = bgColor;
  context.globalAlpha = TRAIL_FADE_ALPHA;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;
}

function paintParticleStrokes(
  context: CanvasFieldRenderingContext,
  particles: ReadonlyArray<Particle>,
  accentColor: string,
): void {
  context.strokeStyle = accentColor;
  context.lineWidth = STROKE_LINE_WIDTH;
  for (const particle of particles) {
    context.beginPath();
    context.moveTo(particle.px, particle.py);
    context.lineTo(particle.x, particle.y);
    context.stroke();
  }
}

function drawSnapshot(
  context: CanvasFieldRenderingContext,
  particles: ReadonlyArray<Particle>,
  width: number,
  height: number,
  accentColor: string,
  bgColor: string,
): void {
  context.globalAlpha = 1;
  context.fillStyle = bgColor;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = accentColor;
  context.lineWidth = STROKE_LINE_WIDTH;
  for (const particle of particles) {
    const angle = noiseField(particle.x, particle.y, 0);
    const dx = Math.cos(angle) * SNAPSHOT_TRAIL_LENGTH;
    const dy = Math.sin(angle) * SNAPSHOT_TRAIL_LENGTH;
    context.beginPath();
    context.moveTo(particle.x, particle.y);
    context.lineTo(particle.x + dx, particle.y + dy);
    context.stroke();
  }
}

export function mountField(deps: CanvasFieldDeps): CanvasFieldHandle {
  const maybeContext = deps.canvas.getContext('2d');
  if (maybeContext === null) {
    return { unmount: (): void => undefined };
  }
  const context: CanvasFieldRenderingContext = maybeContext;

  const width = deps.canvas.width;
  const height = deps.canvas.height;
  const particles = createInitialParticles(width, height, deps.particleCount, deps.random);

  if (deps.prefersReducedMotion) {
    const snapshotColors = deps.getColors();
    drawSnapshot(context, particles, width, height, snapshotColors.accent, snapshotColors.bg);
    return { unmount: (): void => undefined };
  }

  let cursor: Vector2 | null = null;
  let frameHandle: number | null = null;
  let lastTickAt: number | null = null;
  let isUnmounted = false;
  let isIntersecting = deps.initialIsIntersecting;
  let fieldTime = 0;
  let currentColors: ThemeColors = deps.getColors();

  function scheduleNext(): void {
    if (isUnmounted || !isIntersecting || frameHandle !== null) {
      return;
    }
    frameHandle = deps.requestAnimationFrame(onFrame);
  }

  function cancelPending(): void {
    if (frameHandle !== null) {
      deps.cancelAnimationFrame(frameHandle);
      frameHandle = null;
    }
  }

  function onFrame(timestamp: number): void {
    frameHandle = null;
    if (isUnmounted || !isIntersecting) {
      return;
    }
    const previous = lastTickAt;
    if (previous === null || timestamp - previous >= FRAME_DURATION_MS) {
      lastTickAt = timestamp;
      fieldTime += FIELD_TIME_STEP;
      paintTrailFade(context, width, height, currentColors.bg);
      for (const particle of particles) {
        stepParticle(particle, width, height, fieldTime, cursor, deps.repulsionRadius, deps.random);
      }
      paintParticleStrokes(context, particles, currentColors.accent);
    }
    scheduleNext();
  }

  const handlers: InternalPointerHandlers = {
    move: (event: PointerEvent): void => {
      const rect = deps.pointerTarget.getBoundingClientRect();
      const scaleX = rect.width === 0 ? 1 : width / rect.width;
      const scaleY = rect.height === 0 ? 1 : height / rect.height;
      cursor = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    leave: (): void => {
      cursor = null;
    },
  };

  deps.pointerTarget.addEventListener('pointermove', handlers.move);
  deps.pointerTarget.addEventListener('pointerleave', handlers.leave);

  const observer = deps.createIntersectionObserver((entries): void => {
    const entry = entries[0];
    if (entry === undefined) {
      return;
    }
    if (entry.isIntersecting) {
      if (!isIntersecting) {
        isIntersecting = true;
        lastTickAt = null;
        scheduleNext();
      }
    } else {
      isIntersecting = false;
      cancelPending();
    }
  });
  observer.observe(deps.intersectionTarget);

  const unsubscribeColors = deps.subscribeToColors((colors): void => {
    currentColors = colors;
  });

  scheduleNext();

  return {
    unmount: (): void => {
      if (isUnmounted) {
        return;
      }
      isUnmounted = true;
      cancelPending();
      observer.disconnect();
      deps.pointerTarget.removeEventListener('pointermove', handlers.move);
      deps.pointerTarget.removeEventListener('pointerleave', handlers.leave);
      unsubscribeColors();
    },
  };
}
