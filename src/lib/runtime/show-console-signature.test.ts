// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONSOLE_SIGNATURE } from '@/lib/runtime/console-signature';
import {
  showConsoleSignature,
  type ConsoleSignatureWindow,
} from '@/lib/runtime/show-console-signature';

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as ConsoleSignatureWindow).__cv_signature_shown;
});

describe('showConsoleSignature', () => {
  it('calls console.info with the format and styles from buildConsoleSignature on the first invocation', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    showConsoleSignature(window as ConsoleSignatureWindow, CONSOLE_SIGNATURE);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(CONSOLE_SIGNATURE.format, ...CONSOLE_SIGNATURE.styles);
  });

  it('sets window.__cv_signature_shown = true after the first invocation', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    showConsoleSignature(window as ConsoleSignatureWindow, CONSOLE_SIGNATURE);
    expect((window as ConsoleSignatureWindow).__cv_signature_shown).toBe(true);
  });

  it('does NOT call console.info a second time when the flag is already set', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    showConsoleSignature(window as ConsoleSignatureWindow, CONSOLE_SIGNATURE);
    showConsoleSignature(window as ConsoleSignatureWindow, CONSOLE_SIGNATURE);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('treats window.__cv_signature_shown === true as a guard regardless of when it was set', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    (window as ConsoleSignatureWindow).__cv_signature_shown = true;
    showConsoleSignature(window as ConsoleSignatureWindow, CONSOLE_SIGNATURE);
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
