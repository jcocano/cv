import { describe, expect, it } from 'vitest';

import {
  formatExperienceDate,
  type FormattableExperience,
} from '@/lib/content/format-experience-date';

const baseI18n = {
  es: 'placeholder-es',
  en: 'placeholder-en',
};

function makeItem(overrides: Partial<FormattableExperience>): FormattableExperience {
  const dateEnd: string | null = 'dateEnd' in overrides ? (overrides.dateEnd ?? null) : '2024-01';
  return {
    dateStart: overrides.dateStart ?? '2022-01',
    dateEnd,
    role: overrides.role ?? baseI18n,
    location: overrides.location ?? baseI18n,
    description: overrides.description ?? baseI18n,
    displayDate: overrides.displayDate,
  };
}

describe('formatExperienceDate', () => {
  it('returns the displayDate value verbatim when it is provided', () => {
    const item = makeItem({
      dateStart: '2022-01',
      dateEnd: '2024-12',
      displayDate: { es: '2022 → Dic 2024', en: '2022 → Dec 2024' },
    });
    expect(formatExperienceDate(item, 'es')).toBe('2022 → Dic 2024');
    expect(formatExperienceDate(item, 'en')).toBe('2022 → Dec 2024');
  });

  it('falls back to Intl when displayDate is undefined (en uses month abbreviation)', () => {
    const item = makeItem({
      dateStart: '2018-03',
      dateEnd: '2022-03',
      displayDate: undefined,
    });
    expect(formatExperienceDate(item, 'en')).toBe('Mar 2018 → Mar 2022');
  });

  it('falls back to Intl when displayDate is undefined (es uses Spanish month abbreviation, capitalised to match handoff)', () => {
    const item = makeItem({
      dateStart: '2024-12',
      dateEnd: '2026-02',
      displayDate: undefined,
    });
    const formatted = formatExperienceDate(item, 'es');
    expect(formatted).toMatch(/^Dic\.? 2024 → Feb\.? 2026$/);
  });

  it('renders dateEnd === null as "Presente" in es', () => {
    const item = makeItem({
      dateStart: '2024-12',
      dateEnd: null,
      displayDate: undefined,
    });
    const formatted = formatExperienceDate(item, 'es');
    expect(formatted.endsWith('→ Presente')).toBe(true);
  });

  it('renders dateEnd === null as "Present" in en', () => {
    const item = makeItem({
      dateStart: '2024-12',
      dateEnd: null,
      displayDate: undefined,
    });
    const formatted = formatExperienceDate(item, 'en');
    expect(formatted).toBe('Dec 2024 → Present');
  });

  it('does not mutate the input item when reading displayDate', () => {
    const item = makeItem({
      dateStart: '2022-01',
      dateEnd: '2024-12',
      displayDate: { es: '2022 → Dic 2024', en: '2022 → Dec 2024' },
    });
    const before = JSON.stringify(item);
    formatExperienceDate(item, 'es');
    formatExperienceDate(item, 'en');
    expect(JSON.stringify(item)).toBe(before);
  });
});
