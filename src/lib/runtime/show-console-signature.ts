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
  // eslint-disable-next-line no-console
  console.info(payload.format, ...payload.styles);
}
