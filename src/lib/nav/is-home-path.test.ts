import { describe, expect, it } from 'vitest';

import { isHomePath } from './is-home-path';

describe('isHomePath', () => {
  it('returns true when pathname equals baseUrl exactly (production "/cv/")', () => {
    expect(isHomePath('/cv/', '/cv/')).toBe(true);
  });

  it('returns true for index.html under the base ("/cv/index.html")', () => {
    expect(isHomePath('/cv/index.html', '/cv/')).toBe(true);
  });

  it('returns false for a sibling top-level page ("/cv/design-system/")', () => {
    expect(isHomePath('/cv/design-system/', '/cv/')).toBe(false);
  });

  it('returns false for a project page ("/cv/projects/incommers-nft/")', () => {
    expect(isHomePath('/cv/projects/incommers-nft/', '/cv/')).toBe(false);
  });

  it('returns true for root when base is "/" (local preview without base)', () => {
    expect(isHomePath('/', '/')).toBe(true);
  });

  it('returns true for "/index.html" when base is "/"', () => {
    expect(isHomePath('/index.html', '/')).toBe(true);
  });

  it('returns false for "/design-system/" when base is "/"', () => {
    expect(isHomePath('/design-system/', '/')).toBe(false);
  });

  it('treats baseUrl missing trailing slash as equivalent ("/cv" + "/cv/")', () => {
    expect(isHomePath('/cv', '/cv/')).toBe(true);
  });

  it('treats pathname without trailing slash as equivalent ("/cv/" + "/cv")', () => {
    expect(isHomePath('/cv/', '/cv')).toBe(true);
  });

  it('returns false for an empty pathname when base is "/cv/"', () => {
    expect(isHomePath('', '/cv/')).toBe(false);
  });
});
