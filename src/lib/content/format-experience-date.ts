import { normaliseNbsp } from '@/lib/content/normalise-nbsp';
import type { I18nString } from '@/lib/schemas/i18n-string';
import type { LangCode } from '@/lib/theme/toggle-lang';

export interface FormattableExperience {
  dateStart: string;
  dateEnd: string | null;
  role: I18nString;
  location: I18nString;
  description: I18nString;
  displayDate?: I18nString;
}

const LOCALE_BY_LANG: Record<LangCode, string> = {
  es: 'es-ES',
  en: 'en-US',
};

const PRESENT_BY_LANG: Record<LangCode, string> = {
  es: 'Presente',
  en: 'Present',
};

function capitaliseFirstChar(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseIsoMonth(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (match === null) {
    return null;
  }
  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

function formatMonth(date: Date, lang: LangCode): string {
  const formatter = new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const raw = normaliseNbsp(formatter.format(date));
  return capitaliseFirstChar(raw);
}

export function formatExperienceDate(item: FormattableExperience, lang: LangCode): string {
  const override = item.displayDate?.[lang];
  if (override !== undefined) {
    return override;
  }
  const start = parseIsoMonth(item.dateStart);
  const startLabel = start === null ? item.dateStart : formatMonth(start, lang);
  if (item.dateEnd === null) {
    return `${startLabel} → ${PRESENT_BY_LANG[lang]}`;
  }
  const end = parseIsoMonth(item.dateEnd);
  const endLabel = end === null ? item.dateEnd : formatMonth(end, lang);
  return `${startLabel} → ${endLabel}`;
}
