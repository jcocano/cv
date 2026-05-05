import { describe, expect, it } from 'vitest';

import { buildConsoleSignature } from '@/lib/runtime/build-console-signature';
import { CONSOLE_SIGNATURE_PARTS } from '@/lib/runtime/console-signature';

describe('CONSOLE_SIGNATURE_PARTS', () => {
  it('exposes greeting, ascii, and contact as non-empty strings', () => {
    expect(typeof CONSOLE_SIGNATURE_PARTS.greeting).toBe('string');
    expect(typeof CONSOLE_SIGNATURE_PARTS.ascii).toBe('string');
    expect(typeof CONSOLE_SIGNATURE_PARTS.contact).toBe('string');
    expect(CONSOLE_SIGNATURE_PARTS.greeting.length).toBeGreaterThan(0);
    expect(CONSOLE_SIGNATURE_PARTS.ascii.length).toBeGreaterThan(0);
    expect(CONSOLE_SIGNATURE_PARTS.contact.length).toBeGreaterThan(0);
  });

  it('exposes a contact line that includes the email and the LinkedIn handle', () => {
    expect(CONSOLE_SIGNATURE_PARTS.contact).toContain('@');
    expect(CONSOLE_SIGNATURE_PARTS.contact).toContain('gmail.com');
    expect(CONSOLE_SIGNATURE_PARTS.contact).toContain('linkedin.com');
  });

  it('feeds buildConsoleSignature without throwing and yields three %c markers', () => {
    const payload = buildConsoleSignature(CONSOLE_SIGNATURE_PARTS);
    const markers = payload.format.match(/%c/g) ?? [];
    expect(markers).toHaveLength(3);
    expect(payload.styles).toHaveLength(3);
  });
});
