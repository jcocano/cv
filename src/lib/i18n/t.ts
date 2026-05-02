import esStrings from '@/i18n/es.json';
import enStrings from '@/i18n/en.json';
import { DEFAULT_LANG, isLangCode, type LangCode } from '@/lib/theme/toggle-lang';

export type TranslationKey = keyof typeof esStrings;

const STRINGS_BY_LANG: Record<LangCode, Record<TranslationKey, string>> = {
  es: esStrings,
  en: enStrings,
};

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

function interpolate(template: string, vars: Record<string, string> | undefined): string {
  if (!vars) {
    return template;
  }
  return template.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
    const replacement = vars[name];
    return replacement === undefined ? match : replacement;
  });
}

export function t(key: TranslationKey, lang: unknown, vars?: Record<string, string>): string {
  const resolvedLang: LangCode = isLangCode(lang) ? lang : DEFAULT_LANG;
  const template = STRINGS_BY_LANG[resolvedLang][key];
  return interpolate(template, vars);
}
