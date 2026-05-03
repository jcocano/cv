import { describe, expect, it } from 'vitest';

import { shouldReduceMotion } from '@/lib/motion/should-reduce-motion';

interface MediaQueryListMockOptions {
  matches: boolean;
}

function createMediaQueryListMock(options: MediaQueryListMockOptions): MediaQueryList {
  const noopListener = (): void => {};
  return {
    matches: options.matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: noopListener,
    removeListener: noopListener,
    addEventListener: noopListener,
    removeEventListener: noopListener,
    dispatchEvent: () => false,
  };
}

describe('shouldReduceMotion', () => {
  it('returns true when the MediaQueryList reports matches=true', () => {
    const mql = createMediaQueryListMock({ matches: true });
    expect(shouldReduceMotion(mql)).toBe(true);
  });

  it('returns false when the MediaQueryList reports matches=false', () => {
    const mql = createMediaQueryListMock({ matches: false });
    expect(shouldReduceMotion(mql)).toBe(false);
  });
});
