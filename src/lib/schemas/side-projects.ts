import { z } from 'zod';

import { i18nString } from '@/lib/schemas/i18n-string';

export const sideProjectSchema = z
  .object({
    slug: z.string().min(1),
    title: i18nString,
    tagline: i18nString,
    role: i18nString,
    year: z.number().int(),
    cover: z.string().min(1).optional(),
    tags: z.array(z.string()),
    url: z.url().nullable(),
    order: z.number().int(),
  })
  .strict();

export type SideProject = z.infer<typeof sideProjectSchema>;
