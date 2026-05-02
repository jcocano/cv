import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const experienceSchema = z
  .object({
    company: z.string().min(1),
    role: i18nString,
    location: i18nString,
    dateStart: z.string().min(1),
    dateEnd: z.string().min(1).nullable(),
    order: z.number().int(),
    description: i18nString,
    tags: z.array(z.string()).min(1),
    displayDate: i18nString.optional(),
  })
  .strict();

export type Experience = z.infer<typeof experienceSchema>;
