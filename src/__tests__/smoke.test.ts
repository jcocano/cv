import { describe, it, expect } from 'vitest';

import { add } from '@/lib/add';

describe('smoke test harness', () => {
  it('runs add(2, 3) and returns 5', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('runs add with negative numbers and returns the sum', () => {
    expect(add(-4, 1)).toBe(-3);
  });
});
