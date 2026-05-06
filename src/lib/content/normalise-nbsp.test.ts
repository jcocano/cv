import { describe, expect, it } from 'vitest';

import { normaliseNbsp } from '@/lib/content/normalise-nbsp';

const NBSP = ' ';

describe('normaliseNbsp', () => {
  it('replaces a single U+00A0 (non-breaking space) with a regular space', () => {
    const input = `Dic${NBSP}2024`;
    expect(normaliseNbsp(input)).toBe('Dic 2024');
  });

  it('replaces every occurrence when the string contains multiple U+00A0', () => {
    const input = `a${NBSP}b${NBSP}c`;
    expect(normaliseNbsp(input)).toBe('a b c');
  });

  it('returns the input verbatim when no U+00A0 is present', () => {
    expect(normaliseNbsp('Dic 2024')).toBe('Dic 2024');
    expect(normaliseNbsp('')).toBe('');
  });

  it('does not touch other whitespace characters (tab, regular space, newline)', () => {
    const input = 'a\tb c\nd';
    expect(normaliseNbsp(input)).toBe('a\tb c\nd');
  });

  it('does not mutate the input string (returns a fresh value when replacement occurs)', () => {
    const input = `Dic${NBSP}2024`;
    const result = normaliseNbsp(input);
    expect(input).toBe(`Dic${NBSP}2024`);
    expect(result).toBe('Dic 2024');
  });
});
