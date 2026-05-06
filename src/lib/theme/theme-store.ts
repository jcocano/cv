import { DEFAULT_THEME, isThemeName, type ThemeName } from '@/lib/theme/next-theme';

export type ThemeColors = { accent: string; bg: string };

export interface ThemeStoreState {
  theme: ThemeName;
  colors: ThemeColors;
}

export interface MutationObserverLike {
  observe(target: Node, options?: MutationObserverInit): void;
  disconnect(): void;
}

export interface ThemeStoreDeps {
  root: { getAttribute(name: string): string | null };
  readCssVar: (name: string) => string;
  createMutationObserver: (cb: MutationCallback) => MutationObserverLike;
}

export interface ThemeStore {
  getCurrent(): ThemeName;
  getColors(): ThemeColors;
  subscribe(callback: (state: ThemeStoreState) => void): () => void;
}

const DEFAULT_ACCENT = '#a3e635';
const DEFAULT_BG = '#000';
const ACCENT_VAR = '--accent';
const BG_VAR = '--bg';
const THEME_ATTR = 'data-theme';

type Subscriber = (state: ThemeStoreState) => void;

interface SubscriberEntry {
  readonly callback: Subscriber;
}

export function createThemeStore(deps: ThemeStoreDeps): ThemeStore {
  const subscribers: SubscriberEntry[] = [];
  let observer: MutationObserverLike | null = null;

  function readTheme(): ThemeName {
    const raw = deps.root.getAttribute(THEME_ATTR);
    if (isThemeName(raw)) {
      return raw;
    }
    return DEFAULT_THEME;
  }

  function readColors(): ThemeColors {
    const accentRaw = deps.readCssVar(ACCENT_VAR);
    const bgRaw = deps.readCssVar(BG_VAR);
    return {
      accent: accentRaw === '' ? DEFAULT_ACCENT : accentRaw,
      bg: bgRaw === '' ? DEFAULT_BG : bgRaw,
    };
  }

  function readState(): ThemeStoreState {
    return { theme: readTheme(), colors: readColors() };
  }

  function notifyAll(): void {
    const subscribersAtDispatchStart = subscribers.slice();
    for (const entry of subscribersAtDispatchStart) {
      entry.callback(readState());
    }
  }

  function ensureObserver(): void {
    if (observer !== null) {
      return;
    }
    observer = deps.createMutationObserver((): void => {
      notifyAll();
    });
    const target = deps.root as unknown as Node;
    observer.observe(target, { attributes: true, attributeFilter: [THEME_ATTR] });
  }

  function maybeDisconnect(): void {
    if (subscribers.length === 0 && observer !== null) {
      observer.disconnect();
      observer = null;
    }
  }

  return {
    getCurrent: (): ThemeName => readTheme(),
    getColors: (): ThemeColors => readColors(),
    subscribe: (callback): (() => void) => {
      const entry: SubscriberEntry = { callback };
      subscribers.push(entry);
      ensureObserver();
      callback(readState());
      let unsubscribed = false;
      return (): void => {
        if (unsubscribed) {
          return;
        }
        unsubscribed = true;
        const index = subscribers.indexOf(entry);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
        maybeDisconnect();
      };
    },
  };
}

interface BrowserGlobals {
  document: Document;
  window: Window & typeof globalThis;
  MutationObserver: typeof MutationObserver;
}

function getBrowserGlobals(): BrowserGlobals | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }
  if (typeof MutationObserver === 'undefined') {
    return null;
  }
  return { document, window, MutationObserver };
}

const NOOP_UNSUBSCRIBE = (): void => undefined;

const SSG_FALLBACK_STORE: ThemeStore = {
  getCurrent: (): ThemeName => DEFAULT_THEME,
  getColors: (): ThemeColors => ({ accent: DEFAULT_ACCENT, bg: DEFAULT_BG }),
  subscribe: (callback): (() => void) => {
    callback({
      theme: DEFAULT_THEME,
      colors: { accent: DEFAULT_ACCENT, bg: DEFAULT_BG },
    });
    return NOOP_UNSUBSCRIBE;
  },
};

let singleton: ThemeStore | null = null;

function resolveSingleton(): ThemeStore {
  if (singleton !== null) {
    return singleton;
  }
  const browser = getBrowserGlobals();
  if (browser === null) {
    return SSG_FALLBACK_STORE;
  }
  singleton = createThemeStore({
    root: browser.document.documentElement,
    readCssVar: (name): string =>
      browser.window
        .getComputedStyle(browser.document.documentElement)
        .getPropertyValue(name)
        .trim(),
    createMutationObserver: (cb): MutationObserverLike => new browser.MutationObserver(cb),
  });
  return singleton;
}

export const themeStore: ThemeStore = {
  getCurrent: (): ThemeName => resolveSingleton().getCurrent(),
  getColors: (): ThemeColors => resolveSingleton().getColors(),
  subscribe: (callback): (() => void) => resolveSingleton().subscribe(callback),
};
