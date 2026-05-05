export interface ConsoleSignatureParts {
  greeting: string;
  ascii: string;
  contact: string;
}

export interface ConsoleSignaturePayload {
  format: string;
  styles: string[];
}

const GREETING_STYLE = 'font-weight:600;';
const ASCII_STYLE = 'font-family:ui-monospace,Menlo,monospace;line-height:1.2;';
const CONTACT_STYLE = 'font-family:ui-monospace,Menlo,monospace;';

export function buildConsoleSignature(parts: ConsoleSignatureParts): ConsoleSignaturePayload {
  const segments: { content: string; style: string }[] = [];
  if (parts.greeting !== '') {
    segments.push({ content: parts.greeting, style: GREETING_STYLE });
  }
  segments.push({ content: parts.ascii, style: ASCII_STYLE });
  segments.push({ content: parts.contact, style: CONTACT_STYLE });

  const format = segments.map((segment) => `%c${segment.content}`).join('\n');
  const styles = segments.map((segment) => segment.style);
  return { format, styles };
}
