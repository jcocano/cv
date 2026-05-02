export const LANG_CODES = ['es', 'en'] as const;

export type LangCode = (typeof LANG_CODES)[number];

export const DEFAULT_LANG: LangCode = 'es';

export function isLangCode(value: unknown): value is LangCode {
  return value === 'es' || value === 'en';
}

export function toggleLang(current: unknown): LangCode {
  if (!isLangCode(current)) {
    return DEFAULT_LANG;
  }
  return current === 'es' ? 'en' : 'es';
}
