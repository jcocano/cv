import { z } from 'zod';

import { i18nString, i18nStringArray } from '@/lib/schemas/i18n-string';

const summaryStat = z
  .object({
    value: z.string().min(1),
    accent: z.string().nullable(),
    label: i18nString,
  })
  .strict();

export const summarySchema = z
  .object({
    title: i18nString,
    lede: i18nString,
    stats: z.array(summaryStat).min(1),
    paragraphs: i18nStringArray,
    expertise: i18nStringArray,
  })
  .strict();

export type Summary = z.infer<typeof summarySchema>;
export type SummaryStat = z.infer<typeof summaryStat>;
