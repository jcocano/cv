import { describe, expect, it } from 'vitest';

import { WINDOW_ENVS_PAYLOAD } from '@/lib/runtime/window-envs';

describe('WINDOW_ENVS_PAYLOAD', () => {
  it('exports a non-empty string', () => {
    expect(typeof WINDOW_ENVS_PAYLOAD).toBe('string');
    expect(WINDOW_ENVS_PAYLOAD.length).toBeGreaterThan(0);
  });

  it('contains the literal anchor word "vault"', () => {
    expect(WINDOW_ENVS_PAYLOAD).toContain('vault');
  });

  it('does not contain a literal newline (DevTools REPL would show \\n)', () => {
    expect(WINDOW_ENVS_PAYLOAD.includes('\n')).toBe(false);
  });

  it('contains both endpoints of the payload', () => {
    expect(WINDOW_ENVS_PAYLOAD).toContain('No secrets here.');
    expect(WINDOW_ENVS_PAYLOAD).toContain('Thanks for digging.');
  });
});
