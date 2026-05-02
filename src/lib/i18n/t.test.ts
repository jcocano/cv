import { describe, expect, expectTypeOf, it } from 'vitest';

import { t, type TranslationKey } from '@/lib/i18n/t';

describe('t (translation helper)', () => {
  it('returns the Spanish string for a known key when lang is "es"', () => {
    expect(t('nav.home', 'es')).toBe('Inicio');
  });

  it('returns the English string for a known key when lang is "en"', () => {
    expect(t('nav.home', 'en')).toBe('Home');
  });

  it('returns a different string for the same key across languages', () => {
    expect(t('nav.work', 'es')).not.toBe(t('nav.work', 'en'));
  });

  it('falls back to Spanish when lang is an unknown string', () => {
    expect(t('nav.home', 'fr')).toBe(t('nav.home', 'es'));
  });

  it('falls back to Spanish when lang is null', () => {
    expect(t('nav.home', null)).toBe(t('nav.home', 'es'));
  });

  it('falls back to Spanish when lang is undefined', () => {
    expect(t('nav.home', undefined)).toBe(t('nav.home', 'es'));
  });

  it('interpolates {name} placeholder when vars are provided', () => {
    expect(t('greet.hello', 'en', { name: 'Jesus' })).toBe('Hello, Jesus');
  });

  it('interpolates {name} placeholder in Spanish too', () => {
    expect(t('greet.hello', 'es', { name: 'Jesus' })).toBe('Hola, Jesus');
  });

  it('leaves the raw {name} placeholder when no vars are provided', () => {
    expect(t('greet.hello', 'en')).toBe('Hello, {name}');
  });

  it('replaces every occurrence of the same placeholder', () => {
    expect(t('greet.repeat', 'en', { name: 'Jesus' })).toBe('Jesus, Jesus, Jesus');
  });

  it('ignores vars whose placeholder is not present in the string', () => {
    expect(t('nav.home', 'en', { name: 'Jesus' })).toBe('Home');
  });

  it('TranslationKey contains every registered key as a string literal union', () => {
    expectTypeOf<'nav.home'>().toExtend<TranslationKey>();
    expectTypeOf<'cta.toggleTheme'>().toExtend<TranslationKey>();
    expectTypeOf<'greet.hello'>().toExtend<TranslationKey>();
  });

  it('rejects an unknown key at the type level (compile-time guard)', () => {
    expectTypeOf<'this.key.does.not.exist'>().not.toExtend<TranslationKey>();
  });

  it('returns a string at the type level regardless of inputs', () => {
    expectTypeOf(t('nav.home', 'es')).toEqualTypeOf<string>();
    expectTypeOf(t('nav.home', 'es', { name: 'X' })).toEqualTypeOf<string>();
  });
});
