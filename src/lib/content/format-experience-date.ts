import type { I18nString } from '@/lib/schemas/i18n-string';
import type { LangCode } from '@/lib/theme/toggle-lang';

/**
 * Structural minimum required by `formatExperienceDate`. The `Experience`
 * type from the schema satisfies this interface, but defining it locally lets
 * unit tests build fixtures without depending on the full bilingual entry.
 */
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

/**
 * Capitalises the first character so months like "dic" render as "Dic" to
 * match the casing of the design handoff (`Dic 2024 → Feb 2026`). Using a
 * static map of accepted abbreviations would be brittle across locales, so
 * we capitalise the Intl output itself.
 */
function capitaliseMonth(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Parses an ISO `YYYY-MM` (or `YYYY-MM-DD`) string into a UTC `Date` anchored
 * at the first day of the month. Returns `null` if the value cannot be parsed.
 */
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
  // Intl may emit a non-breaking space (U+00A0) between month and year in some
  // locales/runtimes; normalise to a regular space so the output matches the
  // design handoff verbatim ("Dic 2024", "Mar 2018").
  const raw = formatter.format(date).replace(/\u00a0/g, ' ');
  return capitaliseMonth(raw);
}

/**
 * Formats the date span shown in the timeline `.when` cell.
 *
 * - When `displayDate` is provided in the frontmatter, the value for the
 *   active language is used verbatim. This preserves mixed handoff formats
 *   like `2022 → Dec 2024` and `2006 → 2013`.
 * - Otherwise, falls back to `Intl.DateTimeFormat({ month: 'short', year:
 *   'numeric' })` for both endpoints, joined by ` → `.
 * - When `dateEnd === null` the right-hand side becomes `Presente` (es) or
 *   `Present` (en).
 */
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
