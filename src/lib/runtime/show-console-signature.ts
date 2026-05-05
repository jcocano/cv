import type { ConsoleSignaturePayload } from '@/lib/runtime/build-console-signature';

export interface ConsoleSignatureWindow extends Window {
  __cv_signature_shown?: boolean;
}

export function showConsoleSignature(
  targetWindow: ConsoleSignatureWindow,
  payload: ConsoleSignaturePayload,
): void {
  if (targetWindow.__cv_signature_shown === true) {
    return;
  }
  targetWindow.__cv_signature_shown = true;
  // Feature #43 devtools_console_signature — `console.info` is the semantically
  // correct method for the developer-facing greeting; acceptance #1 mandates it.
  // eslint-disable-next-line no-console
  console.info(payload.format, ...payload.styles);
}
