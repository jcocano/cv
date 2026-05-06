import { describe, expect, it, vi } from 'vitest';

import {
  createThemeStore,
  type MutationObserverLike,
  type ThemeStore,
  type ThemeStoreDeps,
  type ThemeStoreState,
} from '@/lib/theme/theme-store';

interface FakeRoot {
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
}

interface ObserverRig {
  factoryCalls: number;
  observeCalls: number;
  disconnectCalls: number;
  fire: () => void;
  observerInstances: number;
}

interface RigOptions {
  initialTheme?: string | null;
  cssVars?: Record<string, string>;
}

interface Rig {
  store: ThemeStore;
  deps: ThemeStoreDeps;
  root: FakeRoot;
  setCssVar: (name: string, value: string) => void;
  setTheme: (value: string | null) => void;
  observerRig: ObserverRig;
  createMutationObserver: ReturnType<typeof vi.fn>;
}

function createRig(options: RigOptions = {}): Rig {
  const initialTheme = options.initialTheme === undefined ? 'dark' : options.initialTheme;
  let currentTheme: string | null = initialTheme;
  const cssVars: Record<string, string> = { ...(options.cssVars ?? {}) };

  const root: FakeRoot = {
    getAttribute: (name): string | null => {
      if (name === 'data-theme') {
        return currentTheme;
      }
      return null;
    },
    setAttribute: (name, value): void => {
      if (name === 'data-theme') {
        currentTheme = value;
      }
    },
  };

  const observerRig: ObserverRig = {
    factoryCalls: 0,
    observeCalls: 0,
    disconnectCalls: 0,
    fire: (): void => {
      throw new Error('observer was not created yet');
    },
    observerInstances: 0,
  };

  const createMutationObserver = vi.fn((cb: MutationCallback): MutationObserverLike => {
    observerRig.factoryCalls += 1;
    const instanceIndex = observerRig.observerInstances;
    observerRig.observerInstances += 1;
    const instance: MutationObserverLike = {
      observe: (): void => {
        observerRig.observeCalls += 1;
      },
      disconnect: (): void => {
        observerRig.disconnectCalls += 1;
      },
    };
    observerRig.fire = (): void => {
      const isLatestObserverInstance = instanceIndex === observerRig.observerInstances - 1;
      if (isLatestObserverInstance) {
        cb([] as unknown as MutationRecord[], instance as unknown as MutationObserver);
      }
    };
    return instance;
  });

  const deps: ThemeStoreDeps = {
    root,
    readCssVar: (name): string => cssVars[name] ?? '',
    createMutationObserver,
  };

  const store = createThemeStore(deps);

  return {
    store,
    deps,
    root,
    setCssVar: (name, value): void => {
      cssVars[name] = value;
    },
    setTheme: (value): void => {
      currentTheme = value;
    },
    observerRig,
    createMutationObserver,
  };
}

describe('createThemeStore — subscribe initial emission', () => {
  it('invokes the callback immediately with the current state', () => {
    const rig = createRig({
      initialTheme: 'light',
      cssVars: { '--accent': '#abc', '--bg': '#def' },
    });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state).toBeDefined();
    if (state === undefined) {
      return;
    }
    expect(state.theme).toBe('light');
    expect(state.colors.accent).toBe('#abc');
    expect(state.colors.bg).toBe('#def');
  });

  it('reads data-theme from root and CSS vars from readCssVar', () => {
    const rig = createRig({
      initialTheme: 'paper',
      cssVars: { '--accent': '#111', '--bg': '#222' },
    });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state?.theme).toBe('paper');
    expect(state?.colors).toEqual({ accent: '#111', bg: '#222' });
  });

  it("falls back to 'dark' when data-theme attribute is null", () => {
    const rig = createRig({ initialTheme: null, cssVars: { '--accent': '#x', '--bg': '#y' } });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state?.theme).toBe('dark');
  });

  it("falls back to 'dark' when data-theme attribute is not a valid ThemeName", () => {
    const rig = createRig({ initialTheme: 'banana', cssVars: { '--accent': '#x', '--bg': '#y' } });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state?.theme).toBe('dark');
  });

  it("falls back to '#a3e635' when --accent is empty", () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '', '--bg': '#000' } });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state?.colors.accent).toBe('#a3e635');
  });

  it("falls back to '#000' when --bg is empty", () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '#a3e635', '--bg': '' } });
    const cb = vi.fn();
    rig.store.subscribe(cb);
    const state = cb.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state?.colors.bg).toBe('#000');
  });
});

describe('createThemeStore — getCurrent / getColors on-the-fly readers', () => {
  it('getCurrent returns the latest data-theme even after the attribute mutates', () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '#a', '--bg': '#b' } });
    expect(rig.store.getCurrent()).toBe('dark');
    rig.setTheme('light');
    expect(rig.store.getCurrent()).toBe('light');
  });

  it('getColors returns the latest CSS var values even after they mutate', () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '#a', '--bg': '#b' } });
    expect(rig.store.getColors()).toEqual({ accent: '#a', bg: '#b' });
    rig.setCssVar('--accent', '#z');
    expect(rig.store.getColors().accent).toBe('#z');
  });
});

describe('createThemeStore — lazy observer lifecycle', () => {
  it('does not create a MutationObserver until the first subscribe', () => {
    const rig = createRig();
    expect(rig.observerRig.factoryCalls).toBe(0);
  });

  it('creates exactly one MutationObserver on the first subscribe and calls observe', () => {
    const rig = createRig();
    rig.store.subscribe(vi.fn());
    expect(rig.observerRig.factoryCalls).toBe(1);
    expect(rig.observerRig.observeCalls).toBe(1);
  });

  it('does not create a second observer when a second subscribe arrives', () => {
    const rig = createRig();
    rig.store.subscribe(vi.fn());
    rig.store.subscribe(vi.fn());
    expect(rig.observerRig.factoryCalls).toBe(1);
    expect(rig.observerRig.observeCalls).toBe(1);
  });

  it('disconnects the observer when the last subscriber unsubscribes', () => {
    const rig = createRig();
    const u1 = rig.store.subscribe(vi.fn());
    const u2 = rig.store.subscribe(vi.fn());
    expect(rig.observerRig.disconnectCalls).toBe(0);
    u1();
    expect(rig.observerRig.disconnectCalls).toBe(0);
    u2();
    expect(rig.observerRig.disconnectCalls).toBe(1);
  });

  it('re-creates a new observer when subscribing again after the last unsubscribe', () => {
    const rig = createRig();
    const u1 = rig.store.subscribe(vi.fn());
    u1();
    expect(rig.observerRig.factoryCalls).toBe(1);
    rig.store.subscribe(vi.fn());
    expect(rig.observerRig.factoryCalls).toBe(2);
    expect(rig.observerRig.observeCalls).toBe(2);
  });
});

describe('createThemeStore — observer dispatch', () => {
  it('notifies all subscribers when the observer fires, with re-read state', () => {
    const rig = createRig({
      initialTheme: 'dark',
      cssVars: { '--accent': '#aaa', '--bg': '#bbb' },
    });
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    rig.store.subscribe(cb1);
    rig.store.subscribe(cb2);
    cb1.mockClear();
    cb2.mockClear();
    rig.setTheme('light');
    rig.setCssVar('--accent', '#fff');
    rig.observerRig.fire();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    const state1 = cb1.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    const state2 = cb2.mock.calls[0]?.[0] as ThemeStoreState | undefined;
    expect(state1?.theme).toBe('light');
    expect(state1?.colors.accent).toBe('#fff');
    expect(state2?.theme).toBe('light');
    expect(state2?.colors.accent).toBe('#fff');
  });

  it('does not notify a subscriber that has unsubscribed', () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '#a', '--bg': '#b' } });
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const u1 = rig.store.subscribe(cb1);
    rig.store.subscribe(cb2);
    cb1.mockClear();
    cb2.mockClear();
    u1();
    rig.observerRig.fire();
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('treats the same callback subscribed twice as two distinct entries', () => {
    const rig = createRig({ initialTheme: 'dark', cssVars: { '--accent': '#a', '--bg': '#b' } });
    const cb = vi.fn();
    const u1 = rig.store.subscribe(cb);
    rig.store.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(2);
    cb.mockClear();
    rig.observerRig.fire();
    expect(cb).toHaveBeenCalledTimes(2);
    cb.mockClear();
    u1();
    rig.observerRig.fire();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
