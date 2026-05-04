import { describe, expect, it } from 'vitest';

import { resolveBrandHref, resolveSectionHref } from './resolve-nav-href';

describe('resolveSectionHref', () => {
  it('returns the hash unchanged when on home (production base)', () => {
    expect(resolveSectionHref('#about', true, '/cv/')).toBe('#about');
    expect(resolveSectionHref('#contact', true, '/cv/')).toBe('#contact');
  });

  it('returns the baseUrl + hash when off home (production base)', () => {
    expect(resolveSectionHref('#about', false, '/cv/')).toBe('/cv/#about');
    expect(resolveSectionHref('#experience', false, '/cv/')).toBe('/cv/#experience');
  });

  it('returns the hash unchanged when on home with root base ("/")', () => {
    expect(resolveSectionHref('#about', true, '/')).toBe('#about');
  });

  it('returns "/" + hash when off home with root base ("/")', () => {
    expect(resolveSectionHref('#about', false, '/')).toBe('/#about');
  });

  it('joins cleanly when baseUrl lacks trailing slash (off home)', () => {
    expect(resolveSectionHref('#about', false, '/cv')).toBe('/cv/#about');
  });
});

describe('resolveBrandHref', () => {
  it('returns "#top" when on home (any base)', () => {
    expect(resolveBrandHref(true, '/cv/')).toBe('#top');
    expect(resolveBrandHref(true, '/')).toBe('#top');
  });

  it('returns the baseUrl when off home (production base)', () => {
    expect(resolveBrandHref(false, '/cv/')).toBe('/cv/');
  });

  it('returns "/" when off home with root base', () => {
    expect(resolveBrandHref(false, '/')).toBe('/');
  });

  it('normalizes a base without trailing slash to include one (off home)', () => {
    expect(resolveBrandHref(false, '/cv')).toBe('/cv/');
  });
});
