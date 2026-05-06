import { describe, expect, it } from 'vitest';

import { appendIndexHtml, isHomePath } from './is-home-path';

describe('isHomePath', () => {
  it('returns true when pathname equals baseUrl exactly (production "/cv/")', () => {
    expect(isHomePath('/cv/', '/cv/')).toBe(true);
  });

  it('returns true for index.html under the base ("/cv/index.html")', () => {
    expect(isHomePath('/cv/index.html', '/cv/')).toBe(true);
  });

  it('returns false for a sibling top-level page ("/cv/the-system/")', () => {
    expect(isHomePath('/cv/the-system/', '/cv/')).toBe(false);
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

  it('returns false for "/the-system/" when base is "/"', () => {
    expect(isHomePath('/the-system/', '/')).toBe(false);
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

describe('appendIndexHtml', () => {
  it('appends "/index.html" to a non-empty base without trailing slash', () => {
    expect(appendIndexHtml('/cv')).toBe('/cv/index.html');
  });

  it('returns "/index.html" when base is the empty string (root preview without prefix)', () => {
    expect(appendIndexHtml('')).toBe('/index.html');
  });

  it('appends "/index.html" to a deeper base', () => {
    expect(appendIndexHtml('/site/cv')).toBe('/site/cv/index.html');
  });
});
