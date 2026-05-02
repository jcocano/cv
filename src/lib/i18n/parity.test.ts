import { describe, expect, it } from 'vitest';

import enStrings from '@/i18n/en.json';
import esStrings from '@/i18n/es.json';

describe('i18n key parity', () => {
  it('declares the same set of keys in es.json and en.json', () => {
    const esKeys = Object.keys(esStrings).sort();
    const enKeys = Object.keys(enStrings).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('declares at least one key (parity is meaningful)', () => {
    const esKeys = Object.keys(esStrings);
    expect(esKeys.length).toBeGreaterThan(0);
  });

  it('keeps every Spanish entry as a non-empty string', () => {
    const empties = Object.entries(esStrings).filter(([, value]) => value.trim().length === 0);
    expect(empties).toEqual([]);
  });

  it('keeps every English entry as a non-empty string', () => {
    const empties = Object.entries(enStrings).filter(([, value]) => value.trim().length === 0);
    expect(empties).toEqual([]);
  });

  it('keeps placeholder tokens consistent across languages for keys that interpolate', () => {
    const placeholderPattern = /\{(\w+)\}/g;
    const extractPlaceholders = (value: string): string[] => {
      const names: string[] = [];
      for (const match of value.matchAll(placeholderPattern)) {
        const captured = match[1];
        if (captured !== undefined) {
          names.push(captured);
        }
      }
      return names.sort();
    };
    type StringKey = keyof typeof esStrings & keyof typeof enStrings;
    const mismatches: Array<{ key: StringKey; es: string[]; en: string[] }> = [];
    for (const key of Object.keys(esStrings) as StringKey[]) {
      const esPlaceholders = extractPlaceholders(esStrings[key]);
      const enPlaceholders = extractPlaceholders(enStrings[key]);
      if (esPlaceholders.join('|') !== enPlaceholders.join('|')) {
        mismatches.push({ key, es: esPlaceholders, en: enPlaceholders });
      }
    }
    expect(mismatches).toEqual([]);
  });
});
