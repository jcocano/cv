import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FRAME_DURATION_MS,
  mountField,
  type CanvasFieldDeps,
  type CanvasFieldHandle,
  type CanvasFieldRenderingContext,
  type FakeCanvas,
  type FakePointerTarget,
  type FakeIntersectionTarget,
  type FakeIntersectionObserver,
} from '@/lib/lab/canvas-field';
import type { ThemeColors } from '@/lib/theme/theme-store';

interface Listeners {
  pointermove: Set<(event: PointerEvent) => void>;
  pointerleave: Set<() => void>;
}

interface DrawCall {
  readonly op: 'fillRect' | 'beginPath' | 'moveTo' | 'lineTo' | 'stroke' | 'clearRect';
  readonly args: ReadonlyArray<number>;
  readonly fillStyle: string;
  readonly strokeStyle: string;
  readonly lineWidth: number;
  readonly globalAlpha: number;
}

interface InspectableFakeCanvas extends FakeCanvas {
  drawCalls: DrawCall[];
}

function createFakeCanvas(): InspectableFakeCanvas {
  const drawCalls: DrawCall[] = [];
  const state = {
    fillStyle: '' as string,
    strokeStyle: '' as string,
    lineWidth: 0,
    globalAlpha: 1,
  };
  const context: CanvasFieldRenderingContext = {
    fillRect: (x, y, w, h): void => {
      drawCalls.push({
        op: 'fillRect',
        args: [x, y, w, h],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    clearRect: (x, y, w, h): void => {
      drawCalls.push({
        op: 'clearRect',
        args: [x, y, w, h],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    beginPath: (): void => {
      drawCalls.push({
        op: 'beginPath',
        args: [],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    moveTo: (x, y): void => {
      drawCalls.push({
        op: 'moveTo',
        args: [x, y],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    lineTo: (x, y): void => {
      drawCalls.push({
        op: 'lineTo',
        args: [x, y],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    stroke: (): void => {
      drawCalls.push({
        op: 'stroke',
        args: [],
        fillStyle: state.fillStyle,
        strokeStyle: state.strokeStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
      });
    },
    get fillStyle(): string | CanvasGradient | CanvasPattern {
      return state.fillStyle;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      state.fillStyle = typeof value === 'string' ? value : '';
    },
    get strokeStyle(): string | CanvasGradient | CanvasPattern {
      return state.strokeStyle;
    },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      state.strokeStyle = typeof value === 'string' ? value : '';
    },
    get lineWidth(): number {
      return state.lineWidth;
    },
    set lineWidth(value: number) {
      state.lineWidth = value;
    },
    get globalAlpha(): number {
      return state.globalAlpha;
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value;
    },
  };
  return {
    width: 600,
    height: 280,
    drawCalls,
    getContext: () => context,
  };
}

function createFakePointerTarget(): { target: FakePointerTarget; listeners: Listeners } {
  const listeners: Listeners = {
    pointermove: new Set(),
    pointerleave: new Set(),
  };
  const target: FakePointerTarget = {
    addEventListener: ((type: string, handler: unknown): void => {
      if (type === 'pointermove') {
        listeners.pointermove.add(handler as (event: PointerEvent) => void);
      } else if (type === 'pointerleave') {
        listeners.pointerleave.add(handler as () => void);
      }
    }) as FakePointerTarget['addEventListener'],
    removeEventListener: ((type: string, handler: unknown): void => {
      if (type === 'pointermove') {
        listeners.pointermove.delete(handler as (event: PointerEvent) => void);
      } else if (type === 'pointerleave') {
        listeners.pointerleave.delete(handler as () => void);
      }
    }) as FakePointerTarget['removeEventListener'],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 280 }),
  };
  return { target, listeners };
}

interface FakeRafScheduler {
  request: (cb: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
  pendingHandles: () => number[];
  tick: (deltaMs: number) => void;
  cancelCount: number;
  requestCount: number;
}

function createFakeRaf(initialNow: number): {
  scheduler: FakeRafScheduler;
  now: () => number;
  setNow: (next: number) => void;
} {
  let currentNow = initialNow;
  let nextHandle = 1;
  const pending: Map<number, FrameRequestCallback> = new Map();
  const scheduler: FakeRafScheduler = {
    request: (cb): number => {
      scheduler.requestCount += 1;
      const handle = nextHandle;
      nextHandle += 1;
      pending.set(handle, cb);
      return handle;
    },
    cancel: (handle): void => {
      if (pending.has(handle)) {
        scheduler.cancelCount += 1;
        pending.delete(handle);
      }
    },
    pendingHandles: (): number[] => Array.from(pending.keys()),
    tick: (deltaMs: number): void => {
      currentNow += deltaMs;
      const drain = Array.from(pending.entries());
      pending.clear();
      for (const [, cb] of drain) {
        cb(currentNow);
      }
    },
    cancelCount: 0,
    requestCount: 0,
  };
  return {
    scheduler,
    now: () => currentNow,
    setNow: (next: number) => {
      currentNow = next;
    },
  };
}

interface IntersectionRig {
  target: FakeIntersectionTarget;
  observer: FakeIntersectionObserver | null;
  trigger: (isIntersecting: boolean) => void;
  factoryCalls: number;
}

function createIntersectionRig(): IntersectionRig {
  const rig: IntersectionRig = {
    target: { tag: 'fake-intersection-target' },
    observer: null,
    trigger: (): void => {
      throw new Error('intersection observer was not created yet');
    },
    factoryCalls: 0,
  };
  return rig;
}

interface ColorsRig {
  current: ThemeColors;
  subscribers: Set<(colors: ThemeColors) => void>;
  unsubscribeCount: number;
  emit: (next: ThemeColors) => void;
}

function createColorsRig(initial: ThemeColors): ColorsRig {
  const rig: ColorsRig = {
    current: { ...initial },
    subscribers: new Set(),
    unsubscribeCount: 0,
    emit: (next: ThemeColors): void => {
      rig.current = { ...next };
      for (const sub of Array.from(rig.subscribers)) {
        sub(rig.current);
      }
    },
  };
  return rig;
}

interface MountedRig {
  deps: CanvasFieldDeps;
  handle: CanvasFieldHandle;
  raf: FakeRafScheduler;
  setNow: (next: number) => void;
  pointerListeners: Listeners;
  intersection: IntersectionRig;
  fakeCanvas: InspectableFakeCanvas;
  colors: ColorsRig;
}

const DEFAULT_ACCENT = '#a3e635';
const DEFAULT_BG = '#000';

function mount(opts: {
  prefersReducedMotion: boolean;
  initialIsIntersecting: boolean;
  particleCount?: number;
  repulsionRadius?: number;
  random?: () => number;
  accentColor?: string;
  bgColor?: string;
}): MountedRig {
  const fakeCanvas = createFakeCanvas();
  const { target: pointerTarget, listeners: pointerListeners } = createFakePointerTarget();
  const intersection = createIntersectionRig();
  const { scheduler: raf, now, setNow } = createFakeRaf(0);
  const colors = createColorsRig({
    accent: opts.accentColor ?? DEFAULT_ACCENT,
    bg: opts.bgColor ?? DEFAULT_BG,
  });

  const deps: CanvasFieldDeps = {
    canvas: fakeCanvas,
    pointerTarget,
    intersectionTarget: intersection.target,
    requestAnimationFrame: raf.request,
    cancelAnimationFrame: raf.cancel,
    now,
    createIntersectionObserver: (callback): FakeIntersectionObserver => {
      intersection.factoryCalls += 1;
      const observerInstance: FakeIntersectionObserver = {
        observe: (): void => {
          // no-op for tests
        },
        disconnect: (): void => {
          intersection.observer = null;
        },
      };
      intersection.observer = observerInstance;
      intersection.trigger = (isIntersecting: boolean): void => {
        callback(
          [{ isIntersecting }] as ReadonlyArray<{ isIntersecting: boolean }>,
          observerInstance,
        );
      };
      return observerInstance;
    },
    prefersReducedMotion: opts.prefersReducedMotion,
    initialIsIntersecting: opts.initialIsIntersecting,
    particleCount: opts.particleCount ?? 90,
    repulsionRadius: opts.repulsionRadius ?? 80,
    random: opts.random ?? (() => 0.5),
    getColors: (): ThemeColors => colors.current,
    subscribeToColors: (cb): (() => void) => {
      colors.subscribers.add(cb);
      return (): void => {
        if (colors.subscribers.delete(cb)) {
          colors.unsubscribeCount += 1;
        }
      };
    },
  };

  const handle = mountField(deps);
  return { deps, handle, raf, setNow, pointerListeners, intersection, fakeCanvas, colors };
}

describe('mountField — animated mode (prefers-reduced-motion: no-preference)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules a rAF callback when initially intersecting', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.raf.pendingHandles()).toHaveLength(1);
  });

  it('does not schedule rAF when initially not intersecting', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: false });
    expect(rig.raf.pendingHandles()).toHaveLength(0);
  });

  it('registers a pointermove listener on the pointer target', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.pointerListeners.pointermove.size).toBe(1);
  });

  it('registers a pointerleave listener on the pointer target', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.pointerListeners.pointerleave.size).toBe(1);
  });

  it('creates exactly one IntersectionObserver via the injected factory', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.intersection.factoryCalls).toBe(1);
  });

  it('keeps re-scheduling rAF on each frame while intersecting', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.raf.tick(FRAME_DURATION_MS);
    expect(rig.raf.pendingHandles()).toHaveLength(1);
    rig.raf.tick(FRAME_DURATION_MS);
    expect(rig.raf.pendingHandles()).toHaveLength(1);
  });

  it('cancels rAF when the observer reports isIntersecting === false', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    const cancelsBefore = rig.raf.cancelCount;
    rig.intersection.trigger(false);
    expect(rig.raf.cancelCount).toBe(cancelsBefore + 1);
    expect(rig.raf.pendingHandles()).toHaveLength(0);
  });

  it('does not re-schedule rAF after the observer reports not intersecting', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.intersection.trigger(false);
    rig.raf.tick(FRAME_DURATION_MS);
    expect(rig.raf.pendingHandles()).toHaveLength(0);
  });

  it('resumes rAF when the observer reports isIntersecting === true again', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.intersection.trigger(false);
    expect(rig.raf.pendingHandles()).toHaveLength(0);
    rig.intersection.trigger(true);
    expect(rig.raf.pendingHandles()).toHaveLength(1);
  });
});

describe('mountField — cleanup factor (returned function)', () => {
  it('cancels the pending rAF handle when invoked while a frame is scheduled', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.raf.pendingHandles()).toHaveLength(1);
    rig.handle.unmount();
    expect(rig.raf.pendingHandles()).toHaveLength(0);
  });

  it('disconnects the IntersectionObserver when invoked', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.intersection.observer).not.toBeNull();
    rig.handle.unmount();
    expect(rig.intersection.observer).toBeNull();
  });

  it('removes the pointermove listener registered during mount', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.pointerListeners.pointermove.size).toBe(1);
    rig.handle.unmount();
    expect(rig.pointerListeners.pointermove.size).toBe(0);
  });

  it('removes the pointerleave listener registered during mount', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.pointerListeners.pointerleave.size).toBe(1);
    rig.handle.unmount();
    expect(rig.pointerListeners.pointerleave.size).toBe(0);
  });

  it('is idempotent: calling it twice does not throw and does not double-cancel', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.handle.unmount();
    const cancelsAfterFirst = rig.raf.cancelCount;
    rig.handle.unmount();
    expect(rig.raf.cancelCount).toBe(cancelsAfterFirst);
  });
});

describe('mountField — reduced motion mode', () => {
  it('does not schedule any rAF when prefersReducedMotion is true', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    expect(rig.raf.requestCount).toBe(0);
    expect(rig.raf.pendingHandles()).toHaveLength(0);
  });

  it('does not register a pointermove listener when prefersReducedMotion is true', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    expect(rig.pointerListeners.pointermove.size).toBe(0);
  });

  it('does not create an IntersectionObserver when prefersReducedMotion is true', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    expect(rig.intersection.factoryCalls).toBe(0);
  });

  it('still draws a static snapshot using stroke() at least once when reduce-motion', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.length).toBeGreaterThan(0);
  });

  it('uses accentColor as strokeStyle for reduce-motion snapshot strokes', () => {
    const rig = mount({
      prefersReducedMotion: true,
      initialIsIntersecting: true,
      accentColor: '#ff00ff',
    });
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.every((c) => c.strokeStyle === '#ff00ff')).toBe(true);
  });

  it('cleanup is a no-op safe to call when prefersReducedMotion is true', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    expect(() => rig.handle.unmount()).not.toThrow();
  });
});

describe('mountField — frame cap to 60fps via delta time', () => {
  it('always runs the very first frame to render an initial state', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS / 4);
    expect(rig.fakeCanvas.drawCalls.length).toBeGreaterThan(0);
  });

  it('skips the simulation step when delta < FRAME_DURATION_MS but still re-schedules rAF', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    // Drain the first frame so lastTickAt is initialized.
    rig.raf.tick(FRAME_DURATION_MS);
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS - 1);
    expect(rig.raf.pendingHandles()).toHaveLength(1);
    expect(rig.fakeCanvas.drawCalls).toHaveLength(0);
  });

  it('runs the simulation step when delta >= FRAME_DURATION_MS', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.raf.tick(FRAME_DURATION_MS);
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    expect(rig.fakeCanvas.drawCalls.length).toBeGreaterThan(0);
  });
});

describe('mountField — render: line trails (paridad con handoff)', () => {
  it('opens the frame with a trail-fade fillRect using bgColor and globalAlpha 0.08', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 2,
      bgColor: '#101010',
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const first = rig.fakeCanvas.drawCalls[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    expect(first.op).toBe('fillRect');
    expect(first.fillStyle).toBe('#101010');
    expect(first.globalAlpha).toBeCloseTo(0.08, 5);
    expect(first.args).toEqual([0, 0, 600, 280]);
  });

  it('restores globalAlpha to 1 after the trail-fade fillRect', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 1,
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((c) => c.globalAlpha === 1)).toBe(true);
  });

  it('draws one beginPath/moveTo/lineTo/stroke per particle, in that order', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 3,
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const ops = rig.fakeCanvas.drawCalls.filter(
      (c) => c.op === 'beginPath' || c.op === 'moveTo' || c.op === 'lineTo' || c.op === 'stroke',
    );
    expect(ops).toHaveLength(12);
    for (let i = 0; i < 3; i += 1) {
      expect(ops[i * 4 + 0]?.op).toBe('beginPath');
      expect(ops[i * 4 + 1]?.op).toBe('moveTo');
      expect(ops[i * 4 + 2]?.op).toBe('lineTo');
      expect(ops[i * 4 + 3]?.op).toBe('stroke');
    }
  });

  it('uses accentColor as strokeStyle and lineWidth 0.6 for every stroke', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 4,
      accentColor: '#a3e635',
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.length).toBe(4);
    expect(strokes.every((c) => c.strokeStyle === '#a3e635')).toBe(true);
    expect(strokes.every((c) => c.lineWidth === 0.6)).toBe(true);
  });

  it('moveTo uses the previous position (px, py) and lineTo uses the new (x, y)', () => {
    // With random=0.5 and particleCount=1, particle starts at (300, 140).
    // After one step, it has been displaced by the noise field; px,py should
    // be the pre-step position (300, 140) and x,y should differ.
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 1,
      random: () => 0.5,
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const moveTo = rig.fakeCanvas.drawCalls.find((c) => c.op === 'moveTo');
    const lineTo = rig.fakeCanvas.drawCalls.find((c) => c.op === 'lineTo');
    expect(moveTo).toBeDefined();
    expect(lineTo).toBeDefined();
    if (moveTo === undefined || lineTo === undefined) {
      return;
    }
    expect(moveTo.args[0]).toBeCloseTo(300, 5);
    expect(moveTo.args[1]).toBeCloseTo(140, 5);
    // After one velocity step the particle has moved (cos/sin of the noise
    // angle, scaled by 0.9). The movement is non-zero with random=0.5.
    const dx = (lineTo.args[0] ?? 0) - (moveTo.args[0] ?? 0);
    const dy = (lineTo.args[1] ?? 0) - (moveTo.args[1] ?? 0);
    expect(dx * dx + dy * dy).toBeGreaterThan(0);
  });
});

describe('mountField — random reset on canvas exit (paridad con handoff)', () => {
  it('respawns a particle at a random in-bounds position when it leaves the canvas', () => {
    // Build a deterministic random sequence: starts particle at the right
    // edge so the next velocity step pushes it out, then provides a respawn
    // location near (60, 28).
    const sequence = [
      0.999, // x = 0.999 * 600 ≈ 599.4 (close to right edge)
      0.5, // y = 0.5 * 280 = 140
      0.1, // first respawn x = 0.1 * 600 = 60
      0.1, // first respawn y = 0.1 * 280 = 28
      0.5,
      0.5,
      0.5,
      0.5,
    ];
    let cursor = 0;
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 1,
      random: (): number => {
        const value = sequence[cursor % sequence.length];
        cursor += 1;
        return value ?? 0.5;
      },
    });
    rig.fakeCanvas.drawCalls.length = 0;
    // Tick enough times to push the right-edge particle out and respawn it.
    for (let i = 0; i < 4; i += 1) {
      rig.raf.tick(FRAME_DURATION_MS);
    }
    const lineTos = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'lineTo');
    expect(lineTos.length).toBeGreaterThan(0);
    for (const call of lineTos) {
      const x = call.args[0] ?? -1;
      const y = call.args[1] ?? -1;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(280);
    }
  });
});

describe('mountField — theme reactivity', () => {
  it('reads initial accentColor for stroke from getColors()', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 2,
      accentColor: '#abc',
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((c) => c.strokeStyle === '#abc')).toBe(true);
  });

  it('reads initial bgColor for trail fade from getColors()', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 1,
      bgColor: '#202020',
    });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const first = rig.fakeCanvas.drawCalls[0];
    expect(first?.op).toBe('fillRect');
    expect(first?.fillStyle).toBe('#202020');
  });

  it('applies new accent color on the next frame after subscribeToColors emits', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 2,
      accentColor: '#aaaaaa',
      bgColor: '#000000',
    });
    // Drain first frame.
    rig.raf.tick(FRAME_DURATION_MS);
    rig.colors.emit({ accent: '#ff00ff', bg: '#000000' });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const strokes = rig.fakeCanvas.drawCalls.filter((c) => c.op === 'stroke');
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((c) => c.strokeStyle === '#ff00ff')).toBe(true);
  });

  it('applies new bg color (trail fade) on the next frame after subscribeToColors emits', () => {
    const rig = mount({
      prefersReducedMotion: false,
      initialIsIntersecting: true,
      particleCount: 1,
      accentColor: '#aaaaaa',
      bgColor: '#101010',
    });
    rig.raf.tick(FRAME_DURATION_MS);
    rig.colors.emit({ accent: '#aaaaaa', bg: '#fefefe' });
    rig.fakeCanvas.drawCalls.length = 0;
    rig.raf.tick(FRAME_DURATION_MS);
    const first = rig.fakeCanvas.drawCalls[0];
    expect(first?.op).toBe('fillRect');
    expect(first?.fillStyle).toBe('#fefefe');
  });

  it('subscribes to colors on mount when motion is allowed', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.colors.subscribers.size).toBe(1);
  });

  it('does not subscribe to colors when prefersReducedMotion is true', () => {
    const rig = mount({ prefersReducedMotion: true, initialIsIntersecting: true });
    expect(rig.colors.subscribers.size).toBe(0);
  });
});

describe('mountField — cleanup factor: colors subscription', () => {
  it('unsubscribes from the colors store on unmount', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    expect(rig.colors.subscribers.size).toBe(1);
    rig.handle.unmount();
    expect(rig.colors.subscribers.size).toBe(0);
    expect(rig.colors.unsubscribeCount).toBe(1);
  });

  it('is idempotent: calling unmount twice does not double-unsubscribe', () => {
    const rig = mount({ prefersReducedMotion: false, initialIsIntersecting: true });
    rig.handle.unmount();
    rig.handle.unmount();
    expect(rig.colors.unsubscribeCount).toBe(1);
  });
});

describe('FRAME_DURATION_MS constant', () => {
  it('targets 60fps (≈16.6ms per frame)', () => {
    expect(FRAME_DURATION_MS).toBeGreaterThanOrEqual(16);
    expect(FRAME_DURATION_MS).toBeLessThan(17);
  });
});
