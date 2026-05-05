// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { applyWindowEnvs, type EnvsWindow } from '@/lib/runtime/apply-window-envs';
import { WINDOW_ENVS_PAYLOAD } from '@/lib/runtime/window-envs';

afterEach(() => {
  delete (window as EnvsWindow).envs;
});

describe('applyWindowEnvs', () => {
  it('assigns the given payload to window.envs', () => {
    applyWindowEnvs(window as EnvsWindow, WINDOW_ENVS_PAYLOAD);
    expect((window as EnvsWindow).envs).toBe(WINDOW_ENVS_PAYLOAD);
  });

  it('keeps window.envs typed as string when payload is a string', () => {
    applyWindowEnvs(window as EnvsWindow, WINDOW_ENVS_PAYLOAD);
    expect(typeof (window as EnvsWindow).envs).toBe('string');
  });

  it('overwrites a previous value (idempotent for the same payload)', () => {
    applyWindowEnvs(window as EnvsWindow, 'first');
    applyWindowEnvs(window as EnvsWindow, WINDOW_ENVS_PAYLOAD);
    expect((window as EnvsWindow).envs).toBe(WINDOW_ENVS_PAYLOAD);
  });
});
