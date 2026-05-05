import { describe, expect, it } from 'vitest';

import { buildConsoleSignature } from '@/lib/runtime/build-console-signature';

describe('buildConsoleSignature', () => {
  it('returns a format string with three %c markers (greeting, ascii, contact) when all parts are present', () => {
    const result = buildConsoleSignature({
      greeting: 'Hello, fellow engineer.',
      ascii: '/\\\n\\/',
      contact: 'mailto:test@example.com',
    });
    const markers = result.format.match(/%c/g);
    expect(markers).not.toBeNull();
    if (markers === null) {
      throw new Error('expected at least one %c marker');
    }
    expect(markers).toHaveLength(3);
  });

  it('embeds the literal content of greeting, ascii, and contact in the format string', () => {
    const result = buildConsoleSignature({
      greeting: 'Hello, fellow engineer.',
      ascii: '/\\\n\\/',
      contact: 'mailto:test@example.com',
    });
    expect(result.format).toContain('Hello, fellow engineer.');
    expect(result.format).toContain('/\\\n\\/');
    expect(result.format).toContain('mailto:test@example.com');
  });

  it('returns styles as an array of strings with the same length as the number of %c markers', () => {
    const result = buildConsoleSignature({
      greeting: 'Hi.',
      ascii: 'x',
      contact: 'mailto:a@b',
    });
    const markers = result.format.match(/%c/g) ?? [];
    expect(result.styles).toHaveLength(markers.length);
    for (const style of result.styles) {
      expect(typeof style).toBe('string');
    }
  });

  it('omits the greeting segment (no %c, no style) when greeting is the empty string', () => {
    const result = buildConsoleSignature({
      greeting: '',
      ascii: '/\\',
      contact: 'mailto:a@b',
    });
    const markers = result.format.match(/%c/g) ?? [];
    expect(markers).toHaveLength(2);
    expect(result.styles).toHaveLength(2);
    expect(result.format).not.toContain('undefined');
  });

  it('still embeds ascii and contact when greeting is empty', () => {
    const result = buildConsoleSignature({
      greeting: '',
      ascii: '/\\\n\\/',
      contact: 'mailto:a@b',
    });
    expect(result.format).toContain('/\\\n\\/');
    expect(result.format).toContain('mailto:a@b');
  });
});
