import { z } from 'zod';

import { i18nString, i18nStringArray } from '@/lib/schemas/i18n-string';

export const experienceSchema = z
  .object({
    company: z.string().min(1),
    role: i18nString,
    location: i18nString,
    dateStart: z.string().min(1),
    dateEnd: z.string().min(1).nullable(),
    order: z.number().int(),
    bullets: i18nStringArray,
  })
  .strict();

export type Experience = z.infer<typeof experienceSchema>;
