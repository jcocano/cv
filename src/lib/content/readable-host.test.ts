import { describe, expect, it } from 'vitest';

import { readableHost } from '@/lib/content/readable-host';

describe('readableHost', () => {
  it('strips https:// from a https url', () => {
    expect(readableHost('https://dragora.gg')).toBe('dragora.gg');
  });

  it('strips http:// from a http url', () => {
    expect(readableHost('http://example.com')).toBe('example.com');
  });

  it('strips a leading www. from the host portion', () => {
    expect(readableHost('https://www.example.com')).toBe('example.com');
  });

  it('strips a trailing slash from the url', () => {
    expect(readableHost('https://dragora.gg/')).toBe('dragora.gg');
  });

  it('combines all three strips (protocol, www., trailing slash)', () => {
    expect(readableHost('http://www.example.com/')).toBe('example.com');
  });

  it('keeps the path when present (only the trailing slash is stripped)', () => {
    expect(readableHost('https://github.com/jcocano/cli-mailer')).toBe(
      'github.com/jcocano/cli-mailer',
    );
  });

  it('keeps a single path with trailing slash stripped', () => {
    expect(readableHost('https://github.com/jcocano/')).toBe('github.com/jcocano');
  });

  it('returns the input unchanged when it has no recognizable protocol or www. prefix', () => {
    expect(readableHost('dragora.gg')).toBe('dragora.gg');
  });
});
