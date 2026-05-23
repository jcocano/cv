import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const publicationSchema = z
  .object({
    slug: z.string().min(1),
    title: i18nString,
    source: z.string().min(1),
    date: z.string().min(1),
    url: z.url(),
    summary: i18nString,
    order: z.number().int(),
  })
  .strict();

export type Publication = z.infer<typeof publicationSchema>;
